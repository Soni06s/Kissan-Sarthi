import nodemailer from 'nodemailer';
import logger from './logger.js';

const createTransporter = () => {
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = Number(process.env.EMAIL_PORT) || 465;
  const secure = process.env.EMAIL_SECURE ? process.env.EMAIL_SECURE === 'true' : port === 465;
  const emailUser = (process.env.EMAIL || process.env.EMAIL_USER || '').trim();
  const emailPassword = (process.env.EMAIL_PASSWORD || process.env.EMAIL_PASS || '').trim();

  if (!emailUser || !emailPassword) {
    const missing = [];
    if (!emailUser) missing.push('EMAIL or EMAIL_USER');
    if (!emailPassword) missing.push('EMAIL_PASSWORD or EMAIL_PASS');
    throw new Error(`Mail credentials missing: set ${missing.join(' and ')} in .env`);
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: emailUser,
      pass: emailPassword,
    },
  });
};

const sendMail = async ({ to, subject, text, html }) => {
  const transporter = createTransporter();
  const from = process.env.EMAIL_FROM || process.env.EMAIL;
  const info = await transporter.sendMail({ from, to, subject, text, html });
  logger.info(`Email sent to ${to}: ${info.messageId}`);
  return info;
};

export default { sendMail };
