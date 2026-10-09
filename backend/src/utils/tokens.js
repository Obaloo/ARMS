const jwt = require('jsonwebtoken');

const signAccessToken = (user) => {
  return jwt.sign(
    { id: user._id.toString(), role: user.role, email: user.email },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
};

const signRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id.toString(), role: user.role, email: user.email },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
};

const signResetToken = (user) => {
  return jwt.sign(
    { id: user._id.toString(), purpose: 'reset' },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '30m' }
  );
};

module.exports = { signAccessToken, signRefreshToken, signResetToken };
