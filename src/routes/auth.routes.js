const router = require('express').Router();
const { 
  register, 
  login, 
  refresh,
  verifyEmail, 
  googleLogin, 
  forgotPassword, 
  resetPassword 
} = require('../controllers/auth.controller');
const validate = require('../middleware/validate');
const { 
  registerSchema, 
  loginSchema, 
  verifyEmailSchema, 
  googleLoginSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema 
} = require('../schemas/auth.schema');

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh-token', refresh);
router.post('/verify-email', validate(verifyEmailSchema), verifyEmail);
router.post('/google-login', validate(googleLoginSchema), googleLogin);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

module.exports = router;
