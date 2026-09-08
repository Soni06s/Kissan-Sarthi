import mailer from '../config/mailer.js';
import logger from '../config/logger.js';

const EMAIL_TEXTS = {
  en: {
    verifyTitle: 'Verify Your Email',
    verifyGreeting: 'Thank you for registering with KissanSarthi. Use the code below to verify your account.',
    resetOtpTitle: 'Reset Your Password (OTP)',
    resetOtpGreeting: 'We received a password reset request. Use the code below to reset your password.',
    resetLinkTitle: 'Reset Your Password',
    resetLinkGreeting: 'We received a request to reset your password. Click the button below to choose a new password.',
    validOtp: 'This OTP is valid for 10 minutes.',
    validLink: 'This link is valid for 15 minutes.',
    ignore: 'If you did not request this, please ignore this email safely.',
    resetButton: 'Reset Password',
  },
  hi: {
    verifyTitle: 'अपना ईमेल सत्यापित करें',
    verifyGreeting: 'किसान सारथी में पंजीकरण करने के लिए धन्यवाद। अपने खाते को सत्यापित करने के लिए नीचे दिए गए कोड का उपयोग करें।',
    resetOtpTitle: 'अपना पासवर्ड रीसेट करें (OTP)',
    resetOtpGreeting: 'हमें पासवर्ड रीसेट का अनुरोध प्राप्त हुआ है। अपना पासवर्ड रीसेट करने के लिए नीचे दिए गए कोड का उपयोग करें।',
    resetLinkTitle: 'अपना पासवर्ड रीसेट करें',
    resetLinkGreeting: 'हमें आपका पासवर्ड रीसेट करने का अनुरोध प्राप्त हुआ है। नया पासवर्ड चुनने के लिए नीचे दिए गए बटन पर क्लिक करें।',
    validOtp: 'यह ओटीपी 10 मिनट के लिए मान्य है।',
    validLink: 'यह लिंक 15 मिनट के लिए मान्य है।',
    ignore: 'यदि आपने यह अनुरोध नहीं किया है, तो कृपया इस ईमेल को अनदेखा करें।',
    resetButton: 'पासवर्ड रीसेट करें',
  },
  gu: {
    verifyTitle: 'તમારું ઇમેઇલ ચકાસો',
    verifyGreeting: 'કિસાન સારથી સાથે નોંધણી કરવા બદલ આભાર. તમારું એકાઉન્ટ ચકાસવા માટે નીચે આપેલા કોડનો ઉપયોગ કરો.',
    resetOtpTitle: 'તમારો પાસવર્ડ રીસેટ કરો (OTP)',
    resetOtpGreeting: 'અમને પાસવર્ડ રીસેટ કરવાની વિનંતી મળી છે. તમારો પાસવર્ડ રીસેટ કરવા માટે નીચેના કોડનો ઉપયોગ કરો.',
    resetLinkTitle: 'તમારો પાસવર્ડ રીસેટ કરો',
    resetLinkGreeting: 'અમને તમારો પાસવર્ડ રીસેટ કરવાની વિનંતી મળી છે. નવો પાસવર્ડ પસંદ કરવા માટે નીચેના બટન પર ક્લિક કરો.',
    validOtp: 'આ OTP 10 મિનિટ માટે માન્ય છે.',
    validLink: 'આ લિંક 15 મિનિટ માટે માન્ય છે.',
    ignore: 'જો તમે આ વિનંતી કરી નથી, તો કૃપા કરીને આ ઇમેઇલને અવગણો.',
    resetButton: 'પાસવર્ડ રીસેટ કરો',
  },
};

const buildEmailTemplate = ({ name, otp, subject, template, language = 'en' }) => {
  const strings = EMAIL_TEXTS[language] || EMAIL_TEXTS.en;
  const isReset = template === 'reset';
  const title = isReset ? strings.resetOtpTitle : strings.verifyTitle;
  const greeting = isReset ? strings.resetOtpGreeting : strings.verifyGreeting;

  return {
    subject: subject || title,
    text: `Hello ${name || 'Farmer'},\n\n${greeting}\n\nOTP: ${otp}\n\n${strings.validOtp}\n\n${strings.ignore}`,
    html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #E5E7EB; borderRadius: 12px;">
      <h2 style="color: #166534; margin-top: 0;">${title}</h2>
      <p>Hello <strong>${name || 'Farmer'}</strong>,</p>
      <p>${greeting}</p>
      <div style="text-align: center; margin: 24px 0;">
        <div style="font-size: 32px; font-weight: 800; letter-spacing: 6px; padding: 14px 28px; background: #F0FDF4; border: 2px dashed #166534; color: #166534; display: inline-block; border-radius: 12px;">
          ${otp}
        </div>
      </div>
      <p style="color: #6B7280; font-size: 13px;">${strings.validOtp}</p>
      <p style="color: #9CA3AF; font-size: 12px; margin-top: 24px;">${strings.ignore}</p>
    </div>`,
  };
};

const sendOTPEmail = async ({ name, email, otp, subject, template, language = 'en' }) => {
  try {
    const message = buildEmailTemplate({ name, otp, subject, template, language });
    await mailer.sendMail({
      to: email,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
    return true;
  } catch (error) {
    logger.error(`Unable to send OTP email to ${email}: ${error.message}`);
    // Don't swallow root cause if critical, but log clearly
    return false;
  }
};

const sendResetLinkEmail = async ({ name, email, resetLink, language = 'en' }) => {
  const strings = EMAIL_TEXTS[language] || EMAIL_TEXTS.en;
  try {
    await mailer.sendMail({
      to: email,
      subject: strings.resetLinkTitle,
      text: `Hello ${name || 'Farmer'},\n\n${strings.resetLinkGreeting}\n\nReset Link: ${resetLink}\n\n${strings.validLink}\n\n${strings.ignore}`,
      html: `<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #E5E7EB; border-radius: 12px;">
        <h2 style="color: #166534; margin-top: 0;">${strings.resetLinkTitle}</h2>
        <p>Hello <strong>${name || 'Farmer'}</strong>,</p>
        <p>${strings.resetLinkGreeting}</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${resetLink}" style="background: #166534; color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 15px; display: inline-block;">
            ${strings.resetButton}
          </a>
        </div>
        <p style="color: #6B7280; font-size: 13px;">${strings.validLink}</p>
        <p style="color: #9CA3AF; font-size: 12px; margin-top: 24px;">${strings.ignore}</p>
        <p style="word-break: break-all; font-size: 11px; color: #9CA3AF;">If the button above does not work, paste this URL into your browser: <br/>${resetLink}</p>
      </div>`,
    });
    return true;
  } catch (error) {
    logger.error(`Unable to send reset link email to ${email}: ${error.message}`);
    return false;
  }
};

export { sendOTPEmail, sendResetLinkEmail };
