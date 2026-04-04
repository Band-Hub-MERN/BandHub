const crypto = require('crypto');
const dns = require('dns').promises;
const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
let transporterPromise = null;
let configuredSendGridApiKey = null;

function getBaseUrl() {
  return process.env.APP_BASE_URL || 'http://localhost:5173';
}

function getMailConfig() {
  const {
    MAIL_HOST,
    MAIL_PORT,
    MAIL_SECURE,
    MAIL_USER,
    MAIL_PASS,
    MAIL_FROM
  } = process.env;

  if (!MAIL_HOST || !MAIL_PORT || !MAIL_USER || !MAIL_PASS || !MAIL_FROM) {
    return null;
  }

  return {
    host: MAIL_HOST,
    port: Number(MAIL_PORT),
    secure: String(MAIL_SECURE || '').toLowerCase() === 'true' || String(MAIL_PORT) === '465',
    auth: {
      user: MAIL_USER,
      pass: MAIL_PASS
    },
    from: MAIL_FROM
  };
}

function getSendGridConfig() {
  const {
    SENDGRID_API_KEY,
    SENDGRID_FROM_EMAIL,
    SENDGRID_FROM_NAME,
    MAIL_FROM
  } = process.env;

  const fromEmail = SENDGRID_FROM_EMAIL || MAIL_FROM;
  if (!SENDGRID_API_KEY || !fromEmail) {
    return null;
  }

  return {
    apiKey: SENDGRID_API_KEY,
    fromEmail,
    fromName: SENDGRID_FROM_NAME || ''
  };
}

function getSendGridFrom(config) {
  if (!config.fromName) {
    return config.fromEmail;
  }

  return {
    email: config.fromEmail,
    name: config.fromName
  };
}

function configureSendGrid(config) {
  if (configuredSendGridApiKey === config.apiKey) {
    return;
  }

  sgMail.setApiKey(config.apiKey);
  configuredSendGridApiKey = config.apiKey;
}

async function getTransporter() {
  if (transporterPromise) {
    return transporterPromise;
  }

  const mailConfig = getMailConfig();
  if (!mailConfig) {
    return null;
  }

  transporterPromise = (async () => {
    let transportHost = mailConfig.host;
    let tlsOptions;

    try {
      const ipv4Addresses = await dns.resolve4(mailConfig.host);
      if (ipv4Addresses.length > 0) {
        transportHost = ipv4Addresses[0];
        tlsOptions = { servername: mailConfig.host };
      }
    } catch (error) {
      // Fall back to the configured hostname if IPv4 resolution is unavailable.
    }

    const transporter = nodemailer.createTransport({
      host: transportHost,
      port: mailConfig.port,
      secure: mailConfig.secure,
      auth: mailConfig.auth,
      tls: tlsOptions
    });

    try {
      await transporter.verify();
      return transporter;
    } catch (error) {
      transporterPromise = null;
      throw error;
    }
  })();

  return transporterPromise;
}

function buildVerificationUrl(token) {
  const baseUrl = getBaseUrl().replace(/\/+$/, '');
  return `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;
}

function createVerificationFields() {
  return {
    verificationToken: crypto.randomBytes(32).toString('hex'),
    verificationExpiresAt: new Date(Date.now() + VERIFICATION_TTL_MS)
  };
}

async function sendVerificationEmail(email, token) {
  const verificationUrl = buildVerificationUrl(token);
  const sendGridConfig = getSendGridConfig();
  const mailConfig = getMailConfig();
  const transporter = sendGridConfig ? null : await getTransporter();

  if (sendGridConfig) {
    configureSendGrid(sendGridConfig);

    await sgMail.send({
      to: email,
      from: getSendGridFrom(sendGridConfig),
      subject: 'Verify your Garage Jam account',
      text: `Welcome to Garage Jam.\n\nVerify your email by opening this link:\n${verificationUrl}\n\nThis link expires in 24 hours.`,
      html: [
        '<p>Welcome to <strong>Garage Jam</strong>.</p>',
        `<p>Verify your email by opening this link:</p><p><a href="${verificationUrl}">${verificationUrl}</a></p>`,
        '<p>This link expires in 24 hours.</p>'
      ].join('')
    });

    console.log(`[email verification] Sent verification email to ${email} via SendGrid`);
    return { verificationUrl, delivery: 'sendgrid' };
  }

  if (!mailConfig || !transporter) {
    console.log(`[email verification] Send verification email to ${email}`);
    console.log(`[email verification] Verification link: ${verificationUrl}`);
    console.log('[email verification] SMTP is not configured, so the link was logged instead of emailed.');
    return { verificationUrl, delivery: 'logged' };
  }

  await transporter.sendMail({
    from: mailConfig.from,
    to: email,
    subject: 'Verify your Garage Jam account',
    text: `Welcome to Garage Jam.\n\nVerify your email by opening this link:\n${verificationUrl}\n\nThis link expires in 24 hours.`,
    html: [
      '<p>Welcome to <strong>Garage Jam</strong>.</p>',
      `<p>Verify your email by opening this link:</p><p><a href="${verificationUrl}">${verificationUrl}</a></p>`,
      '<p>This link expires in 24 hours.</p>'
    ].join('')
  });

  console.log(`[email verification] Sent verification email to ${email}`);
  return { verificationUrl, delivery: 'email' };
}

module.exports = {
  createVerificationFields,
  sendVerificationEmail,
  buildVerificationUrl,
  VERIFICATION_TTL_MS
};
