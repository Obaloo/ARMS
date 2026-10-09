const nodemailer = require('nodemailer');

const createTransport = () => {
  if (!process.env.SMTP_HOST) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_PORT === '465', // true for port 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false // Helps with some Gmail configurations
    }
  });
};

const sendEmail = async ({ to, subject, html }) => {
  const transport = createTransport();
  if (!transport) {
    console.log('Email transport not configured - skipping email send');
    return;
  }

  try {
    await transport.sendMail({
      from: process.env.SMTP_FROM || 'arms@system.local',
      to,
      subject,
      html,
    });
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error('Failed to send email:', error.message);
    // Don't throw the error - just log it so the app continues working
  }
};

module.exports = { sendEmail };
