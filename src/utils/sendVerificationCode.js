import nodemailer from 'nodemailer';
import { capitalizeName } from './capitalizeName.js';

export async function sendVerificationEmail(email, name, verificationCode) {
  const capitalizedName = capitalizeName(name);

  const text = `Dear ${capitalizedName},

Welcome to the college portal!

Your verification code is:

${verificationCode}

Please enter this code to verify your email address.

If you did not request this, please ignore this message.

Best regards,
${process.env.COLLEGE_NAME},
${process.env.COLLEGE_ADDRESS}`;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.COLLEGE_EMAIL,
      pass: process.env.COLLEGE_EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.COLLEGE_EMAIL,
    to: email,
    subject: 'Email Verification Code',
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
}
