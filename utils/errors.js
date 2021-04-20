internalError = {
  message: "Internal server error",
  status: 500,
};

nicknameInUse = {
  message: "This nickname is already in use",
  status: 400,
};

emailInUse = {
  message: "This e-mail is already in use",
  status: 400,
};

incorrectCredentials = {
  message: "Incorrect email or password entered. Please try again.",
  status: 403,
};

notAuthSrc = {
  message: "You are not authorized to view this page",
  status: 401,
};

module.exports = {
  internalError,
  nicknameInUse,
  emailInUse,
  incorrectCredentials,
  notAuthSrc,
};
