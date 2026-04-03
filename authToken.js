const jwt = require('jsonwebtoken');
require('dotenv').config();

function getSecret() {
  if (!process.env.ACCESS_TOKEN_SECRET) {
    throw new Error('ACCESS_TOKEN_SECRET is not defined');
  }
  return process.env.ACCESS_TOKEN_SECRET;
}

exports.createAuthToken = function (user) {
  const payload = {
    sub: String(user._id),
    email: user.email,
    accountType: user.accountType,
    displayName: user.displayName,
    organizationId: user.organizationId ? String(user.organizationId) : null
  };

  return jwt.sign(payload, getSecret(), { expiresIn: '12h' });
};

exports.verifyAuthToken = function (token) {
  return jwt.verify(token, getSecret());
};

exports.decodeAuthToken = function (token) {
  return jwt.decode(token, { complete: true });
};
