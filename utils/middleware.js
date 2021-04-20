const { notAuthSrc } = require("./errors");

function checkAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(notAuthSrc.status).render("index.ejs", { error: notAuthSrc });
  //res.sendStatus(401);
  //localStorage.setItem("userId", req.body.userid)
}

function checkNotAuth(req, res, next) {
  if (req.isAuthenticated()) {
    res.status(notAuthSrc.status).render("user.ejs", { error: notAuthSrc });
    // res.status(403).redirect("/user");
    return;
  }
  next();
}

module.exports = {
  checkAuth,
  checkNotAuth,
};
