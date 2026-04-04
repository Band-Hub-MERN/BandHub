const crypto = require('crypto');
const dns = require('dns').promises;
const nodemailer = require('nodemailer');

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
let transporterPromise = null;

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
  const mailConfig = getMailConfig();
  const transporter = await getTransporter();

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
