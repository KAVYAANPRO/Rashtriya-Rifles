const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendOtpSchema,
  googleLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} = require('../schemas/auth.schema');

router.post('/register', validate(registerSchema), ctrl.register);
router.post('/login', validate(loginSchema), ctrl.login);
router.post('/refresh-token', ctrl.refresh);
router.post('/verify-email', validate(verifyEmailSchema), ctrl.verifyEmail);
router.post('/resend-otp', validate(resendOtpSchema), ctrl.resendOtp);
router.post('/google-login', validate(googleLoginSchema), ctrl.googleLogin);
router.post('/forgot-password', validate(forgotPasswordSchema), ctrl.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), ctrl.resetPassword);

// Current user profile
router.get('/me', authenticate, ctrl.me);
router.patch('/me', authenticate, validate(updateProfileSchema), ctrl.updateMe);

module.exports = router;
