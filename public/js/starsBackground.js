function createStarfield (mapWidth, mapHeight)
{
  //  Starfield background
  //  The scrollFactor values give them their 'parallax' effect

  var group = scene.add.group({ key: 'backgroundStarSmall', frameQuantity: 1024 });

  group.createMultiple({ key: 'backgroundStarBig', frameQuantity: 128 });

  var rect = new Phaser.Geom.Rectangle(0, 0, mapWidth, mapHeight);

  Phaser.Actions.RandomRectangle(group.getChildren(), rect);

  group.children.iterate(function (child) {

    var sf = Math.max(0.3, Math.random());

    if (child.texture.key === 'bigStar')
    {
      sf = 0.2;
    }

    child.setScrollFactor(sf);

  }, this);
}

export default createStarfield;