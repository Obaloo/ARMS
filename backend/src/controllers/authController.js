const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { signAccessToken, signRefreshToken, signResetToken } = require('../utils/tokens');
const { sendEmail } = require('../utils/mailer');

const registerSuperAdmin = async (req, res) => {
  const existingAdmin = await User.findOne({ role: 'super_admin' });
  if (existingAdmin) {
    return res.status(400).json({ message: 'Super admin already exists' });
  }

  const user = await User.create({ ...req.body, role: 'super_admin' });
  return res.status(201).json({ id: user._id, email: user.email });
};

const registerStudent = async (req, res) => {
  const { firstName, lastName, matricNumber, email, password } = req.body;
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(400).json({ message: 'Email already in use' });
  }

  const existingMatric = await User.findOne({ matricNumber: matricNumber.toUpperCase() });
  if (existingMatric) {
    return res.status(400).json({ message: 'Matric number already in use' });
  }

  const student = await User.create({
    firstName,
    lastName,
    matricNumber: matricNumber.toUpperCase(),
    email,
    password,
    role: 'student',
  });

  return res.status(201).json({ id: student._id, email: student.email, role: student.role });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.isActive) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isValid = await user.comparePassword(password);
  if (!isValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  user.refreshToken = refreshToken;
  await user.save();

  return res.json({
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      matricNumber: user.matricNumber,
      email: user.email,
      role: user.role,
    },
  });
};

const refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: 'Refresh token required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const accessToken = signAccessToken(user);
    return res.json({ accessToken });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.json({ message: 'If user exists, reset email has been sent' });
  }

  const token = signResetToken(user);
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  await sendEmail({
    to: user.email,
    subject: 'CoreNova Password Reset',
    html: `<p>Reset your password: <a href="${resetUrl}">${resetUrl}</a></p>`,
  });

  return res.json({ message: 'If user exists, reset email has been sent' });
};

const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    if (decoded.purpose !== 'reset') {
      return res.status(400).json({ message: 'Invalid token' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.password = password;
    await user.save();
    return res.json({ message: 'Password reset successful' });
  } catch (error) {
    return res.status(400).json({ message: 'Invalid or expired token' });
  }
};

const me = async (req, res) => {
  return res.json({
    id: req.user._id,
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    matricNumber: req.user.matricNumber,
    email: req.user.email,
    role: req.user.role,
  });
};

module.exports = {
  registerSuperAdmin,
  registerStudent,
  login,
  refresh,
  forgotPassword,
  resetPassword,
  me,
};
