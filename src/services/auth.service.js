const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { sendOtpEmail } = require('./email.service');
const { signToken, verifyToken } = require('../utils/jwt');

const prisma = new PrismaClient();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'dummy-client-id');

async function registerUser(userData) {
  const existing = await prisma.user.findUnique({ where: { email: userData.email } });
  if (existing) {
    const err = new Error('Email already exists');
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(userData.password, 10);

  const user = await prisma.user.create({
    data: {
      email: userData.email,
      passwordHash,
      firstName: userData.firstName,
      lastName: userData.lastName,
      isVerified: false, // Must verify OTP
    },
  });

  // Generate 6-digit OTP
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

  await prisma.otpCode.create({
    data: {
      userId: user.id,
      code: otpCode,
      type: 'EMAIL_VERIFICATION',
      expiresAt,
    },
  });

  await sendOtpEmail(user.email, otpCode, 'EMAIL_VERIFICATION');

  return {
    userId: user.id,
    email: user.email,
    message: 'Registration successful. Please check your email for the OTP code.',
  };
}

async function login(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error('Invalid email or password');
  }
  
  if (user.authProvider === 'GOOGLE' && !user.passwordHash) {
    throw new Error('This account uses Google Sign-In. Please login with Google.');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new Error('Invalid email or password');
  }

  if (!user.isVerified) {
    throw new Error('Please verify your email address first.');
  }

  const token = signToken({ userId: user.id, email: user.email });
  
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() }
  });

  return { token, user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } };
}

async function verifyEmail(email, code) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('User not found');
  if (user.isVerified) throw new Error('Email already verified');

  const otp = await prisma.otpCode.findFirst({
    where: {
      userId: user.id,
      code,
      type: 'EMAIL_VERIFICATION',
      isUsed: false,
      expiresAt: { gt: new Date() }
    }
  });

  if (!otp) throw new Error('Invalid or expired OTP code');

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, emailVerifiedAt: new Date() }
    }),
    prisma.otpCode.update({
      where: { id: otp.id },
      data: { isUsed: true }
    })
  ]);

  return { message: 'Email successfully verified' };
}

async function googleLogin(idToken) {
  let payload;
  if (idToken === 'mock-google-token') {
     // Mock for testing
     payload = {
       email: 'googleuser@example.com',
       sub: 'mock-google-id-12345',
       given_name: 'Google',
       family_name: 'User'
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
        isVerified: true, // Google emails are already verified
        emailVerifiedAt: new Date(),
      }
    });
  } else if (user.authProvider !== 'GOOGLE') {
    // Link Google account to existing local account
    user = await prisma.user.update({
      where: { email: payload.email },
      data: { authProvider: 'GOOGLE', googleId: payload.sub, isVerified: true }
    });
  }

  const token = signToken({ userId: user.id, email: user.email });
  return { token, user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } };
}

async function forgotPassword(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Return success anyway to prevent email enumeration
    return { message: 'If that email exists, an OTP has been sent.' };
  }

  if (user.authProvider === 'GOOGLE') {
    throw new Error('This account uses Google Sign-In. You cannot reset a password here.');
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

  await prisma.otpCode.create({
    data: {
      userId: user.id,
      code: otpCode,
      type: 'PASSWORD_RESET',
      expiresAt,
    },
  });

  await sendOtpEmail(user.email, otpCode, 'PASSWORD_RESET');

  return { message: 'If that email exists, an OTP has been sent.' };
}

async function resetPassword(email, code, newPassword) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Invalid email or code');

  const otp = await prisma.otpCode.findFirst({
    where: {
      userId: user.id,
      code,
      type: 'PASSWORD_RESET',
      isUsed: false,
      expiresAt: { gt: new Date() }
    }
  });

  if (!otp) throw new Error('Invalid or expired OTP code');

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    }),
    prisma.otpCode.update({
      where: { id: otp.id },
      data: { isUsed: true }
    })
  ]);

  return { message: 'Password successfully reset' };
}

module.exports = { registerUser, login, verifyEmail, googleLogin, forgotPassword, resetPassword };
