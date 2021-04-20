import createStarfield from './starsBackground.js '

const config = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1600,
    height: 1200
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  },
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: {
        x: 0,
        y: 0
      }
    }
  }
};

const game = new Phaser.Game(config);

let keyA, keyD, keyW, keySpace;

const baseImgPath = "assets/img"

function preload() {
  this.load.image('ship', `${baseImgPath}/spaceShips_001.png`);
  this.load.image('otherPlayer', `${baseImgPath}/enemyBlack5.png`);
  this.load.image('bullet', `${baseImgPath}/bullet.png`);
  this.load.image('star', `${baseImgPath}/star_gold.png`);
  this.load.image('backgroundStarSmall', `${baseImgPath}/backgroundStar1.png`);
  this.load.image('backgroundStarBig', `${baseImgPath}/backgroundStar2.png`);
}

function create() {
  
  const self = this;
  window.scene = this;
  keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
  keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
  keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
  keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

  this.socket = io();
  this.otherPlayers = this.physics.add.group();
  this.bullets = this.physics.add.group();

  //Draws players
  this.socket.on('currentPlayers', function (players) {
    Object.keys(players).forEach(function (id) {
      if (players[id].playerId === self.socket.id) {
        addPlayer(self, players[id]);
      } else {
        addOtherPlayers(self, players[id]);
      }
    });
  });
  // compares the positions of bullets in the client and in the server
  // redraws them in correct locations if significant differences are found
   this.socket.on('bulletUpdate', function (bulletData, maximumBulletDeviation) {
    let id
    self.bullets.getChildren().forEach(function (bullet) {
      id = bullet.bulletId;
      // If bullet exists in server
      if (typeof bulletData[id] != `undefined`){
        // If bullet is desynchronized - redraw it
        if(Phaser.Math.Distance.Between(bulletData[id].x, bulletData[id].y, bullet.x, bullet.y) > maximumBulletDeviation){
          addBullet(self, bulletData[id]);
          bullet.destroy();
        }
      }
      else{
        bullet.destroy();
      }
    });
  });


  this.socket.on('newPlayer', function (playerInfo) {
    addOtherPlayers(self, playerInfo);
  });

  this.socket.on('disconnect', function (playerId) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerId === otherPlayer.playerId) {
        otherPlayer.destroy();
      }
    });
  });

  //Draws player movement
  this.socket.on('playerMoved', function (playerInfo) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerInfo.playerId === otherPlayer.playerId) {
        otherPlayer.setRotation(playerInfo.rotation);
        otherPlayer.setPosition(playerInfo.x, playerInfo.y);
      }
    });
  });

  // Destroys a dead player's ship
  this.socket.on('playerDied', function (playerId) {
    // Finds the player who died
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if(playerId == otherPlayer.playerId){
        otherPlayer.destroy();
        return;
      }
    });
    // If the player who died is the client
    if(playerId == self.socket.id){
      self.ship.destroy();
    }
  });

  // Destroys a dead bullet's body
  this.socket.on('bulletDied', function (bulletId) {
    // Finds the bullet which died
    self.bullets.getChildren().forEach(function (bullet) {
      if(bulletId == bullet.bulletId){
        bullet.destroy();
        return;
      }
    });
  });

  // Draws all bullets upon connecting to a server
  this.socket.on('currentBullets', function (bullets) {
    Object.keys(bullets).forEach(function (id){
      addBullet(self, bullets[id]);
    })
  });

  // Draws a bullet after it has been fired
  this.socket.on('bulletFired', function (bulletData) {
    addBullet(self, bulletData)
  }
  );

  this.cursors = this.input.keyboard.createCursorKeys();
  //Adds score text in the top left corner
  this.blueScoreText = this.add.text(16, 16, '', { fontSize: '32px', fill: '#0000FF' });
  this.redScoreText = this.add.text(16, 64, '', { fontSize: '32px', fill: '#FF0000' });
  this.blueScoreText.setScrollFactor(0,0);
  this.redScoreText.setScrollFactor(0,0);

  this.socket.on('scoreUpdate', function (scores) {
    self.blueScoreText.setText('Blue: ' + scores.blue);
    self.redScoreText.setText('Red: ' + scores.red);
  });
  //Draws a star
  this.socket.on('starLocation', function (starLocation) {
    if (self.star) self.star.destroy();
    self.star = self.physics.add.image(starLocation.x, starLocation.y, 'star');
    self.physics.add.overlap(self.ship, self.star, function () {
      this.socket.emit('starCollected');
    }, null, self);
  });
  //Draws background stars, sets map's and camera's bounds
  this.socket.on('createMap', function (mapWidth, mapHeight) {
    createStarfield(mapWidth,mapHeight);
    window.scene.physics.world.setBounds(0, 0, mapWidth, mapHeight);
    scene.cameras.main.setBounds(0, 0, mapWidth, mapHeight);
  });
}
//Adds a controllable player to the game
function addPlayer(self, playerInfo) {
  self.ship = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'ship').setOrigin(0.5, 0.5).setDisplaySize(53, 40).setRotation(playerInfo.rotation).setCollideWorldBounds(true);
  bulletPlayerOverlap(self);
  scene.cameras.main.startFollow(self.ship);
  if (playerInfo.team === 'blue') {
    self.ship.setTint(0x0000ff);
  } else {
    self.ship.setTint(0xff0000);
  }
  self.ship.setDrag(100);
  self.ship.setAngularDrag(100);
  self.ship.body.setMaxSpeed(600);
}

function fireBullet(self) {
  self.socket.emit('bulletFiring', self.ship.body.velocity.x, self.ship.body.velocity.y);
}

//Adds opponent players to the game
function addOtherPlayers(self, playerInfo) {
  const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, 'otherPlayer').setOrigin(0.5, 0.5).setDisplaySize(53, 40).setRotation(playerInfo.rotation);
  
  if (playerInfo.team === 'blue') {
    otherPlayer.setTint(0x0000ff);
  } else {
    otherPlayer.setTint(0xff0000);
  }
  otherPlayer.playerId = playerInfo.playerId;
  self.otherPlayers.add(otherPlayer);
}

function addBullet(self, bulletData) {
  const bullet = self.physics.add.sprite(bulletData.x, bulletData.y, 'bullet').setOrigin(0.5, 0.5).setDisplaySize(33, 6).setRotation(bulletData.rotation);
  self.bullets.add(bullet);
  //gives the bullet sprite velocity
  bullet.body.setVelocityX(bulletData.velocityX);
  bullet.body.setVelocityY(bulletData.velocityY);
  bullet.timeFired = bulletData.timeFired;
  bullet.ownerId = bulletData.ownerId;
  bullet.bulletId = bulletData.bulletId;
}
// Bullets destroying ships. Ships own bullets cant destroy them for 0.5 sec since the moment of firing
function bulletPlayerOverlap (self) {
  self.physics.add.overlap(self.otherPlayers, self.bullets, function(player, bullet) {
    if(bullet.ownerId == self.socket.id)
    {
      self.socket.emit('playerShot', player.playerId, bullet.bulletId);
    }
    
  });
  self.physics.add.overlap(self.ship, self.bullets, function(player, bullet) {
    if(bullet.ownerId == self.socket.id)
    {
      let d = new Date();
      let currTime = d.getTime();
      // If  0.5 sec has passed since the moment of firing
      if(currTime - bullet.timeFired > 500){
        self.socket.emit('playerShot', self.socket.id, bullet.bulletId);
      }
      
    }
    
  });

}

//Continously updates player's location and movement parameters
function update() {
  var angularVelocity = 150;
  if (this.ship != undefined) {
    if (this.ship.body != undefined){
      if (this.cursors.left.isDown || keyA.isDown) {
        this.ship.setAngularVelocity(-angularVelocity);
      } else if (this.cursors.right.isDown || keyD.isDown) {
        this.ship.setAngularVelocity(angularVelocity);
      } else {
        this.ship.setAngularVelocity(0);
      }
    
      if (this.cursors.up.isDown || keyW.isDown) {
        this.physics.velocityFromRotation(this.ship.rotation + Math.PI / 2, 600, this.ship.body.acceleration);
      } else {
        this.ship.setAcceleration(0);
      }
  
      if(keySpace.isDown)
      {
        fireBullet(this);
      }
  
      // emit player movement
      var x = this.ship.x;
      var y = this.ship.y;
      var r = this.ship.rotation;
      if (this.ship.oldPosition && (x !== this.ship.oldPosition.x || y !== this.ship.oldPosition.y || r !== this.ship.oldPosition.rotation)) {
        this.socket.emit('playerMovement', { x: this.ship.x, y: this.ship.y, rotation: this.ship.rotation });
      }
      // save old position data
      this.ship.oldPosition = {
        x: this.ship.x,
        y: this.ship.y,
        rotation: this.ship.rotation
      };
    }
    
  }
}



function render() {

}