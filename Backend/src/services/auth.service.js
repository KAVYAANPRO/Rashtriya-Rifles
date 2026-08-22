const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');
const prisma = require('../config/prisma');
const { sendOtpEmail } = require('./email.service');
const { signToken } = require('../utils/jwt');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'dummy-client-id');

/** Everything the client is allowed to see about a user. */
const PUBLIC_USER_FIELDS = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  city: true,
  country: true,
  bio: true,
  profilePictureUrl: true,
  preferredCurrency: true,
  languagePreference: true,
  authProvider: true,
  isVerified: true,
  isPremium: true,
};

function fail(message, statusCode = 400, code) {
  const err = new Error(message);
  err.statusCode = statusCode;
  if (code) err.code = code;
  return err;
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone ?? null,
    city: user.city ?? null,
    country: user.country ?? null,
    bio: user.bio ?? null,
    profilePictureUrl: user.profilePictureUrl ?? null,
    preferredCurrency: user.preferredCurrency ?? 'USD',
    languagePreference: user.languagePreference ?? 'en',
    authProvider: user.authProvider ?? 'LOCAL',
    isVerified: user.isVerified ?? false,
    isPremium: user.isPremium ?? false,
  };
}

async function issueOtp(userId, email, type) {
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

  await prisma.otpCode.create({
    data: { userId, code: otpCode, type, expiresAt },
  });

  await sendOtpEmail(email, otpCode, type);
  return otpCode;
}

async function registerUser(userData) {
  const existing = await prisma.user.findUnique({ where: { email: userData.email } });
  if (existing) {
    throw fail('Email already exists', 409);
  }

  const passwordHash = await bcrypt.hash(userData.password, 10);

  const user = await prisma.user.create({
    data: {
      email: userData.email,
      passwordHash,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phone: userData.phone || null,
      city: userData.city || null,
      country: userData.country || null,
      bio: userData.bio || null,
      isVerified: false, // Must verify OTP
    },
  });

  await issueOtp(user.id, user.email, 'EMAIL_VERIFICATION');

  return {
    userId: user.id,
    email: user.email,
    requiresVerification: true,
    message: 'Registration successful. Please check your email for the OTP code.',
  };
}

async function login(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw fail('Invalid email or password', 401);
  }

  if (user.authProvider === 'GOOGLE' && !user.passwordHash) {
    throw fail('This account uses Google Sign-In. Please login with Google.', 400);
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw fail('Invalid email or password', 401);
  }

  if (!user.isVerified) {
    throw fail('Please verify your email address first.', 403, 'EMAIL_NOT_VERIFIED');
  }

  const token = signToken({ userId: user.id, email: user.email });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return { token, user: publicUser(user) };
}

async function verifyEmail(email, code) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw fail('User not found', 404);
  if (user.isVerified) throw fail('Email already verified', 409);

  const otp = await prisma.otpCode.findFirst({
    where: {
      userId: user.id,
      code,
      type: 'EMAIL_VERIFICATION',
      isUsed: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (!otp) throw fail('Invalid or expired OTP code', 422);

  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, emailVerifiedAt: new Date() },
    }),
    prisma.otpCode.update({
      where: { id: otp.id },
      data: { isUsed: true },
    }),
  ]);

  // Log them straight in — they just proved they own the address.
  const token = signToken({ userId: user.id, email: user.email });

  return { message: 'Email successfully verified', token, user: publicUser(updatedUser) };
}

async function resendOtp(email, type = 'EMAIL_VERIFICATION') {
  const user = await prisma.user.findUnique({ where: { email } });
  // Never confirm whether an address exists.
  if (!user) return { message: 'If that email exists, a new code has been sent.' };
  if (type === 'EMAIL_VERIFICATION' && user.isVerified) {
    throw fail('Email already verified', 409);
  }

  await issueOtp(user.id, user.email, type);
  return { message: 'If that email exists, a new code has been sent.' };
}

async function googleLogin(idToken) {
  let payload;
  if (idToken === 'mock-google-token') {
    // Mock for testing
    payload = {
      email: 'googleuser@example.com',
      sub: 'mock-google-id-12345',
      given_name: 'Google',
      family_name: 'User',
    };
  } else {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  }

  let user = await prisma.user.findUnique({ where: { email: payload.email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: payload.email,
        authProvider: 'GOOGLE',
        googleId: payload.sub,
        firstName: payload.given_name || 'User',
        lastName: payload.family_name || '',
        profilePictureUrl: payload.picture || null,
        isVerified: true, // Google emails are already verified
        emailVerifiedAt: new Date(),
      },
    });
  } else if (user.authProvider !== 'GOOGLE') {
    // Link Google account to existing local account
    user = await prisma.user.update({
      where: { email: payload.email },
      data: { authProvider: 'GOOGLE', googleId: payload.sub, isVerified: true },
    });
  }

  const token = signToken({ userId: user.id, email: user.email });
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  return { token, user: publicUser(user) };
}

async function forgotPassword(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Return success anyway to prevent email enumeration
    return { message: 'If that email exists, an OTP has been sent.' };
  }

  if (user.authProvider === 'GOOGLE') {
    throw fail('This account uses Google Sign-In. You cannot reset a password here.', 400);
  }

  await issueOtp(user.id, user.email, 'PASSWORD_RESET');

  return { message: 'If that email exists, an OTP has been sent.' };
}

async function resetPassword(email, code, newPassword) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw fail('Invalid email or code', 422);

  const otp = await prisma.otpCode.findFirst({
    where: {
      userId: user.id,
      code,
      type: 'PASSWORD_RESET',
      isUsed: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (!otp) throw fail('Invalid or expired OTP code', 422);

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    }),
    prisma.otpCode.update({
      where: { id: otp.id },
      data: { isUsed: true },
    }),
  ]);

  return { message: 'Password successfully reset' };
}

async function getProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: PUBLIC_USER_FIELDS,
  });
  if (!user) throw fail('User not found', 404);

  const tripCount = await prisma.trip.count({ where: { userId } });

  return { ...publicUser(user), tripCount, tripLimit: user.isPremium ? null : 3 };
}

async function updateProfile(userId, data) {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: PUBLIC_USER_FIELDS,
  });
  return publicUser(user);
}

module.exports = {
  registerUser,
  login,
  verifyEmail,
  resendOtp,
  googleLogin,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  publicUser,
};
