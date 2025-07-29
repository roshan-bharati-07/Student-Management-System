import nodemailer from 'nodemailer';
import { capitalizeName } from './capitalizeName.js';


export async function sendCredentialsEmail(email, name, username, password, generateEmail) {
  const capitalized = capitalizeName(name);

  const generateCredentialsText = ({ capitalizeName, username, password, generateEmail }) => {
    return `Dear ${capitalizeName},

Welcome to the college portal!

Here are your login credentials:

Username: ${username}
Password: ${password}
School email: ${generateEmail}

Your school email also shares same password as your Student Management System account do.
But please wait for 3-4 days until the email is registered. If you try to create by yourself this email you might 
face exclusion from school emailing protocol.

Please keep this information secure.

Best regards,
${process.env.COLLEGE_NAME},
${process.env.COLLEGE_ADDRESS}`;
  };

  const text = generateCredentialsText({ capitalizeName: capitalized, username, password, generateEmail });

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.COLLEGE_EMAIL,
      pass: process.env.COLLEGE_EMAIL_PASSWORD,
    },
  });

  const mailOptions = {
    from: `${process.env.COLLEGE_EMAIL}>`,
    to: email,
    subject: 'Your College Account Credentials',
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending credentials email:', error);
    return false;
  }
}
