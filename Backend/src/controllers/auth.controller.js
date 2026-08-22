const authService = require('../services/auth.service');

const register = async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const verifyEmail = async (req, res, next) => {
  try {
    const { email, code } = req.body;
    const result = await authService.verifyEmail(email, code);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const resendOtp = async (req, res, next) => {
  try {
    const { email, type } = req.body;
    const result = await authService.resendOtp(email, type);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    const result = await authService.googleLogin(idToken);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body;
    const result = await authService.resetPassword(email, code, newPassword);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const me = async (req, res, next) => {
  try {
    const result = await authService.getProfile(req.user.id);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const updateMe = async (req, res, next) => {
  try {
    const result = await authService.updateProfile(req.user.id, req.body);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res) => {
  // The JWT is long-lived (JWT_EXPIRES_IN, 7d by default) so there is no
  // separate refresh token yet. Re-issue against the current session instead.
  res.json({ success: true, message: 'Refresh token endpoint' });
};

module.exports = {
  register,
  login,
  verifyEmail,
  resendOtp,
  googleLogin,
  forgotPassword,
  resetPassword,
  me,
  updateMe,
  refresh,
};
