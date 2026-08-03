import mailer from '../config/mailer.js';
import logger from '../config/logger.js';

const buildEmailTemplate = ({ name, otp, subject, template }) => {
  const title = template === 'reset' ? 'Reset Your Password' : 'Verify Your Email';
  const body = template === 'reset'
    ? `Hello ${name},\n\nWe received a password reset request for your account.\n\nYour OTP is:\n\n${otp}\n\nThis OTP is valid for 5 minutes.\n\nIf you did not request this, please ignore this email.`
    : `Hello ${name},\n\nThank you for registering with KissanSarthi.\n\nYour OTP is:\n\n${otp}\n\nThis OTP is valid for 5 minutes.\n\nIf you did not request this, please ignore this email.`;

  return {
    subject: subject || title,
    text: body,
    html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
      <h2 style="color: #166534;">${title}</h2>
      <p>Hello ${name},</p>
      <p>${template === 'reset' ? 'We received a password reset request for your account.' : 'Thank you for registering with KissanSarthi.'}</p>
      <p>Your OTP is:</p>
      <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; padding: 14px 20px; background: #f3f4f6; display: inline-block; border-radius: 8px;">${otp}</div>
      <p>This OTP is valid for 5 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    </div>`,
  };
};

const sendOTPEmail = async ({ name, email, otp, subject, template }) => {
  try {
    const message = buildEmailTemplate({ name, otp, subject, template });
    await mailer.sendMail({
      to: email,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
    return true;
  } catch (error) {
    logger.error(`Unable to send OTP email: ${error.message}`);
    throw error;
  }
};

export { sendOTPEmail };
