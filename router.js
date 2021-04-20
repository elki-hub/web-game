const express = require("express");
const router = express.Router();
const passport = require("passport");
const { generateSalt, hash } = require("./hashing");
const { checkAuth, checkNotAuth } = require("./utils/middleware");

const { database } = require("./dbConfig");
const { internalError, nicknameInUse, emailInUse } = require("./utils/errors");

// on signup
router.all("/", checkNotAuth, (req, res) => {
  res.render("index.ejs");
});

/**
 * ------------ GET ROUTES ------------
 */

router.get("/user", checkAuth, (req, res) => {
  res.render("user.ejs", { user: req.user });
});

router.get("/login", checkNotAuth, (req, res) => {
  res.render("login.ejs");
});

router.get("/game", (req, res) => {
  res.render("game.ejs");
});

router.get("/signup", checkNotAuth, (req, res) => {
  res.render("signup.ejs");
});

router.get("/logout", (req, res) => {
  req.logOut();
  res.redirect("/");
});

/**
 * ------------ POST ROUTES ------------
 */

router.post(
  "/login",
  checkNotAuth,
  passport.authenticate("local", {
    successRedirect: "/user",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

router.post("/signup", checkNotAuth, async (req, res) => {
  const { email, nickname, password } = req.body;
  const emailUnique = `SELECT * FROM "SpaceRoyale".Users WHERE email = '${email}' LIMIT 1`;
  const nicknameUnique = `SELECT * FROM "SpaceRoyale".Users WHERE nickname = '${nickname}' LIMIT 1`;
  let salt = generateSalt(12);

  let insertData = `INSERT INTO "SpaceRoyale".Users VALUES (DEFAULT, '${nickname}', '${email}', '${salt}', '${
    hash(password, salt).hashedpassword
  }') RETURNING *;`;
  database.query(nicknameUnique, (err1, res1) => {
    if (err1) {
      console.log(err1.stack);
      return res
        .status(internalError.status)
        .render("index.ejs", { error: internalError.message });
    }
    if (res1.rows[0]) {
      return res
        .status(nicknameInUse.status)
        .render("signup.ejs", { errorNick: nicknameInUse.message });
      //resError(res, 500, "This nickname is already in use");
    }

    database.query(emailUnique, (err2, res2) => {
      if (err2) {
        console.log(err2.stack);
        return res
          .status(internalError.status)
          .render("signup.ejs", internalError.message);
      }

      if (res2.rows[0]) {
        return res
          .status(emailInUse.status)
          .render("signup.ejs", { errorEmail: emailInUse.message });
      }

      database.query(insertData, (err3, res3) => {
        if (err3) {
          console.log(err3.stack);
          return res
            .status(internalError.status)
            .render("index.ejs", { error: internalError.message });
        }
        return res.render("login.ejs", {
          success: "You have successfully created an account",
        });
      });
    });
  });
});

function onStarCollected() {
  console.log("onStarCount");
  const text =
    'UPDATE "SpaceRoyale".Users SET starcount = starcount+1 WHERE userid = 1 RETURNING *';
  database.query(text, (err, res) => {
    if (err) {
      console.log(err.stack);
    } else {
      console.log(res.rows);
    }
  });
}

module.exports = {
  router,
  onStarCollected,
};
