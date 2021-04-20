const LocalStrategy = require("passport-local").Strategy;
const { compare } = require("./hashing");

const { database } = require("./dbConfig");
const { internalError, incorrectCredentials } = require("./utils/errors");

function initialize(passport) {
  const authenticateUser = async (email, password, done) => {
    const passwordSaltText = `SELECT * FROM "SpaceRoyale".Users WHERE email = '${email}';`;
    database.query(passwordSaltText, (err1, res1) => {
      if (err1) {
        //res.status(500).render("login", internalError);
        return done(null, false, {
          message: internalError.message,
        });
      }
      if (res1.rows.length > 0) {
        const user = res1.rows[0];
        if (compare(password, user.salt, user.hash)) {
          return done(null, user);
        }
        return done(null, false, { message: incorrectCredentials.message });
      } else {
        // No user
        return done(null, false, { message: incorrectCredentials.message });
      }
    });
  };

  passport.use(
    new LocalStrategy(
      { usernameField: "email", passwordField: "password" },
      authenticateUser
    )
  );
  passport.serializeUser((user, done) => {
    done(null, user.userid);
  });
  passport.deserializeUser(async (id, done) => {
    const getUserById = `SELECT * FROM "SpaceRoyale".Users WHERE userid = '${id}';`;
    database.query(getUserById, (error, results) => {
      if (error) {
        return done(null, false, { message: internalError.message });
      }
      const user = results.rows[0];
      return done(null, user);
    });
  });
}

module.exports = initialize;
