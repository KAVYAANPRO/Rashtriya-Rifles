const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, 
  auth: {
    user: process.env.SMTP_USER, 
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async ({ to, subject, text, html }) => {
  // If SMTP is not configured, just log the OTP for local development and return
  if (!process.env.SMTP_USER) {
    console.log(`\n📧 [MOCK EMAIL to ${to}]`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${text}\n`);
    return true;
  }

  try {
    const info = await transporter.sendMail({
      from: `"GlobeTrotter" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log('Email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

const sendOtpEmail = async (to, otp, purpose) => {
  const subjects = {
    EMAIL_VERIFICATION: 'Verify your GlobeTrotter Email',
    PASSWORD_RESET: 'Reset your GlobeTrotter Password',
  };
  
  const subject = subjects[purpose] || 'Your GlobeTrotter OTP Code';
  const text = `Your One-Time Password (OTP) is: ${otp}. It will expire in 15 minutes.`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>GlobeTrotter</h2>
      <p>Hello,</p>
      <p>Your One-Time Password (OTP) for <strong>${purpose.replace('_', ' ').toLowerCase()}</strong> is:</p>
      <h1 style="color: #4A90E2; letter-spacing: 2px;">${otp}</h1>
      <p>This code will expire in 15 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    </div>
  `;

  return sendEmail({ to, subject, text, html });
};

module.exports = {
  sendEmail,
  sendOtpEmail,
};
