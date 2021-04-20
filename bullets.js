// Updates the position of all bullets based on their trajectory
let calculateCurrentBulletPositions = (bullets, players, mapWidth, mapHeight) => {
    let d = new Date();
    let currTime = d.getTime();
    // amount of time that has passed since last bullet update measured in miliseconds
    let timeDiff;
    Object.keys(bullets).forEach(function (id){
        timeDiff = currTime - bullets[id].timeLastUpdated;
        bullets[id].x += bullets[id].velocityX * timeDiff / 1000; //division is needed because timeDiff is measured in ms 
        bullets[id].y += bullets[id].velocityY * timeDiff / 1000; //but velocity is measured in px/s
        bullets[id].timeLastUpdated = currTime;
        // Delete the bullet if it is out of map bounds
        if(bullets[id].x < 0 || bullets[id].y < 0 || bullets[id].x > mapWidth || bullets[id].y > mapHeight){
          // Check if the player who fired the bullet still exists
          if(players[bullets[id].ownerId] != undefined)
          {
            players[bullets[id].ownerId].bulletCount--;
          }
          delete bullets[id];
        }
    })
};

// Checks if the player has reached active bullet limit or rate of fire limit
// Saves the bullet and returns its Id if all checks are passed
let ableToFire = (bullets, player, bulletLimit, bulletReload, bulletVelocity, shipVelocityX, shipVelocityY) => {
  if(player != undefined){
    if(player.bulletCount < bulletLimit)
    {
      let d = new Date();
      let currTime = d.getTime();
      // if the player is not exceeding fire rate limit
      if(currTime - player.lastBulletFiredDate >= bulletReload)
      {
        // A unique string which adds up players id, current time and players current bullet count
        // It has to be different for every bullet because hashmap requires every key to be unique
        let uniquestring = player.playerId.concat(currTime).concat(player.bulletCount);
        // save the data of the bullet in the server
        bullets[uniquestring] = {
          rotation: player.rotation - Math.PI / 2,
          x: player.x, // + -Math.sin(player.rotation) * 50,
          y: player.y, // + Math.cos(player.rotation) * 50,
          // Adds players velocity to the bullet speed
          velocityX: shipVelocityX + -Math.sin(player.rotation) * bulletVelocity,
          velocityY: shipVelocityY + Math.cos(player.rotation) * bulletVelocity,
          timeLastUpdated: currTime,
          timeFired: currTime,
          ownerId: player.playerId,
          bulletId: uniquestring
        };
      player.bulletCount++;
      player.lastBulletFiredDate = currTime;
      return uniquestring;
      }
    }
  }
    
    return false;
}


module.exports = {
    calculateCurrentBulletPositions,
    ableToFire
}

