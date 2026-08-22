const { z } = require('zod');

const optionalText = (max) =>
  z.string().max(max).optional().or(z.literal('')).transform((v) => (v ? v : undefined));

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: optionalText(30),
  city: optionalText(100),
  country: optionalText(100),
  bio: optionalText(2000),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

const resendOtpSchema = z.object({
  email: z.string().email(),
  type: z.enum(['EMAIL_VERIFICATION', 'PASSWORD_RESET']).default('EMAIL_VERIFICATION'),
});

const googleLoginSchema = z.object({
  idToken: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().max(30).nullable().optional(),
  city: z.string().max(100).nullable().optional(),
  country: z.string().max(100).nullable().optional(),
  bio: z.string().max(2000).nullable().optional(),
  profilePictureUrl: z.string().url().max(255).nullable().optional(),
  preferredCurrency: z.string().length(3).optional(),
  languagePreference: z.string().max(10).optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendOtpSchema,
  googleLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
};
