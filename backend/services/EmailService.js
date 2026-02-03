/**
 * Email Service (SendGrid)
 * services/EmailService.js
 *
 * Production-ready email sender with retry logic.
 */

const sgMail = require('@sendgrid/mail');
const logger = require('../utils/logger');

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'no-reply@example.com';
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'Music App';
const APP_BASE_URL = process.env.APP_BASE_URL || 'http://localhost:5000';
const EMAIL_RETRY_COUNT = parseInt(process.env.EMAIL_RETRY_COUNT || '3', 10);
const EMAIL_RETRY_DELAY_MS = parseInt(process.env.EMAIL_RETRY_DELAY_MS || '500', 10);

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
} else {
  logger.warn('[EMAIL] SENDGRID_API_KEY missing. Emails will be skipped.');
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldRetry = (error) => {
  const statusCode = error?.code || error?.statusCode || error?.response?.statusCode;
  return statusCode === 429 || (statusCode >= 500 && statusCode < 600);
};

const sendWithRetry = async (msg) => {
  if (!SENDGRID_API_KEY) {
    return { skipped: true };
  }

  let lastError = null;
  for (let attempt = 1; attempt <= EMAIL_RETRY_COUNT; attempt += 1) {
    try {
      const [response] = await sgMail.send(msg);
      return response;
    } catch (err) {
      lastError = err;
      logger.error(`[EMAIL] Send failed (attempt ${attempt}/${EMAIL_RETRY_COUNT}): ${err.message}`);

      if (!shouldRetry(err) || attempt === EMAIL_RETRY_COUNT) {
        break;
      }

      const delay = EMAIL_RETRY_DELAY_MS * attempt;
      await sleep(delay);
    }
  }

  throw lastError;
};

const EmailService = {
  async sendVerificationEmail({ to, code, username }) {
    const verifyUrl = `${APP_BASE_URL}/profil/kod-dogrulama.html`;

    const msg = {
      to,
      from: { email: EMAIL_FROM, name: EMAIL_FROM_NAME },
      subject: 'E-posta Doğrulama Kodunuz',
      text: `Merhaba ${username || ''}. Doğrulama kodunuz: ${code}. Doğrulama sayfası: ${verifyUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Merhaba ${username || ''}</h2>
          <p>Doğrulama kodunuz:</p>
          <h3>${code}</h3>
          <p>Doğrulama sayfası: <a href="${verifyUrl}">${verifyUrl}</a></p>
        </div>
      `
    };

    return sendWithRetry(msg);
  },

  async sendPasswordResetEmail({ to, resetToken, username }) {
    const resetUrl = `${APP_BASE_URL}/profil/sifremi-unuttum.html?token=${encodeURIComponent(resetToken)}`;

    const msg = {
      to,
      from: { email: EMAIL_FROM, name: EMAIL_FROM_NAME },
      subject: 'Şifre Sıfırlama',
      text: `Merhaba ${username || ''}. Şifre sıfırlama bağlantınız: ${resetUrl}`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Merhaba ${username || ''}</h2>
          <p>Şifrenizi sıfırlamak için aşağıdaki linke tıklayın:</p>
          <p><a href="${resetUrl}">${resetUrl}</a></p>
        </div>
      `
    };

    return sendWithRetry(msg);
  },

  async sendWelcomeEmail({ to, username }) {
    const msg = {
      to,
      from: { email: EMAIL_FROM, name: EMAIL_FROM_NAME },
      subject: 'Hoş Geldiniz!',
      text: `Merhaba ${username || ''}. Sonara’ya hoş geldiniz!`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Hoş Geldiniz ${username || ''} 🎵</h2>
          <p>Sonara’ya katıldığınız için teşekkürler.</p>
        </div>
      `
    };

    return sendWithRetry(msg);
  }
};

module.exports = EmailService;
