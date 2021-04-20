const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io").listen(server);
const { router, onStarCollected } = require("./router");
//const middleware = require("./utils/middleware");
const { calculateCurrentBulletPositions, ableToFire } = require("./bullets.js");
const passport = require("passport");
const flash = require("express-flash");
const session = require("express-session");
const { internalError } = require("./utils/errors");

//passport and session
const initializePassport = require("./passportConfig");
initializePassport(passport); //

var mapWidth = 6400;
var mapHeight = 3200;

let bulletLimit = 2; // Limit of active bullets a player can have at a time
let bulletReload = 500; // Time after firing during which the player cannot fire (measured in ms)
let bulletVelocity = 400; // Speed at which the bullets travel (measured in pixels/s)

let bulletUpdateInterval = 300; // How often server updates bullet positions
// How much can bullets desynchronize between client and server before getting redrawn.
let maximumBulletDeviation = 10; // Measured in pixels.

var players = {};
let bullets = {};

let star = {
  x: Math.floor(Math.random() * (mapWidth - 100)) + 50,
  y: Math.floor(Math.random() * (mapHeight - 100)) + 50,
};
let scores = {
  blue: 0,
  red: 0,
};

app.use(express.urlencoded({ extended: false })); // Express body parser
app.use(flash()); //
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    //store: sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // Equals for 1 day (1day, 24h, 60min, 60s)
    },
  })
); //

app.use(passport.initialize()); //
app.use(passport.session()); //

app.set("views", __dirname + "/public");
app.set("view engine", "ejs");

app.use(express.static(__dirname + "/public"));
//app.use(middleware.loggingMiddleware);
app.use("/", router);

app.use((req, res, next) => {
  //if(req.session.passport.user !== null) //if true user is logedin
  //console.log(req.session);
  //console.log(req.user);
  next();
});

// Updates the position of all bullets every interval miliseconds
function calculateBulletPositionsOnInterval(
  bullets,
  players,
  mapWidth,
  mapHeight,
  bulletUpdateInterval
) {
  calculateCurrentBulletPositions(bullets, players, mapWidth, mapHeight);
  io.emit("bulletUpdate", bullets, maximumBulletDeviation);
  setTimeout(
    calculateBulletPositionsOnInterval,
    bulletUpdateInterval,
    bullets,
    players,
    mapWidth,
    mapHeight,
    bulletUpdateInterval
  );
}

// when a player connects to the server
io.on("connection", function (socket) {
  let d = new Date();
  let currTime = d.getTime();
  console.log("a user connected: ", socket.id);
  // create a new player and add it to our players object
  players[socket.id] = {
    rotation: Math.random() * Math.PI * 2,
    x: Math.floor(Math.random() * (mapWidth - 100)) + 50,
    y: Math.floor(Math.random() * (mapHeight - 100)) + 50,
    playerId: socket.id,
    team: Math.floor(Math.random() * 2) === 0 ? "red" : "blue",
    // tracks the amount of currently active bullets the player has fired
    bulletCount: 0,
    // tracks the last time the player fired a bullet
    lastBulletFiredDate: currTime,
  };
  // send the players object to the new player
  socket.emit("currentPlayers", players);
  calculateCurrentBulletPositions(bullets, players, mapWidth, mapHeight);
  // send the bullets object to the new player
  socket.emit("currentBullets", bullets);
  // send the star object to the new player
  socket.emit("starLocation", star);
  // send the current scores
  socket.emit("scoreUpdate", scores);
  // update all other players of the new player
  socket.broadcast.emit("newPlayer", players[socket.id]);
  //send map size
  socket.emit("createMap", mapWidth, mapHeight);

  // when a player disconnects, remove them from our players object
  socket.on("disconnect", function () {
    console.log("user disconnected: ", socket.id);
    delete players[socket.id];
    // emit a message to all players to remove this player
    io.emit("disconnect", socket.id);
  });

  // when a player moves, update the player data
  socket.on("playerMovement", function (movementData) {
    if (players[socket.id] != undefined) {
      players[socket.id].x = movementData.x;
      players[socket.id].y = movementData.y;
      players[socket.id].rotation = movementData.rotation;
      // emit a message to all players about the player that moved
      // Might want to make this a volatile emit https://socket.io/docs/v3/emitting-events/
      socket.broadcast.emit("playerMoved", players[socket.id]);
    }
  });

  // when a player tries to fire, perform checks, save and emit bullet data if a shot is legit
  socket.on("bulletFiring", function (shipVelocityX, shipVelocityY) {
    let bulletId = ableToFire(
      bullets,
      players[socket.id],
      bulletLimit,
      bulletReload,
      bulletVelocity,
      shipVelocityX,
      shipVelocityY
    );
    // if checks have passed
    if (bulletId != false) {
      // emit the bullet data to all players
      io.emit("bulletFired", bullets[bulletId]);
    }
  });

  socket.on("playerShot", function (playerId, bulletId) {
    io.emit("playerDied", playerId);
    io.emit("bulletDied", bulletId);
    delete players[playerId];
    delete bullets[bulletId];
  });

  // when a player picks up a star
  socket.on("starCollected", function () {
    console.log("STAR COLLECTED");
    if (players[socket.id].team === "red") {
      scores.red += 10;
    } else {
      scores.blue += 10;
    }
    star.x = Math.floor(Math.random() * (mapWidth - 100)) + 50;
    star.y = Math.floor(Math.random() * (mapHeight - 100)) + 50;
    io.emit("starLocation", star);
    io.emit("scoreUpdate", scores);
    //example query which makes changes in the database
    onStarCollected();
  });
});

calculateBulletPositionsOnInterval(
  bullets,
  players,
  mapWidth,
  mapHeight,
  bulletUpdateInterval
);

app.use((err, req, res, next) => {
  console.error(err.stack);
  //const internalError = { message: "Internal server error", status: 500 };
  if (req.user != null) {
    res
      .status(internalError.status)
      .render("user.ejs", { error: internalError });
  } else {
    res
      .status(internalError.status)
      .render("index.ejs", { error: internalError });
  }
});

server.listen(process.env.PORT || 80, function () {
  console.log(`Listening on ${server.address().port}`);
  console.log(`Jump to http://localhost:${server.address().port}`);
});
