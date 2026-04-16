const crypto = require('crypto');
const dns = require('dns').promises;
const sgMail = require('@sendgrid/mail');
const nodemailer = require('nodemailer');

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_PASSWORD_TTL_MS = 60 * 60 * 1000;
const SENDGRID_EMAIL_VALIDATION_URL = 'https://api.sendgrid.com/v3/validations/email';
const RESERVED_TEST_DOMAINS = new Set([
  'example.com',
  'example.net',
  'example.org',
  'invalid',
  'localhost',
  'test'
]);
const COMMON_DOMAIN_SUGGESTIONS = new Map([
  ['gamil.com', 'gmail.com'],
  ['gmai.com', 'gmail.com'],
  ['gmail.con', 'gmail.com'],
  ['gmial.com', 'gmail.com'],
  ['gmal.com', 'gmail.com'],
  ['gnail.com', 'gmail.com'],
  ['hotmai.com', 'hotmail.com'],
  ['hotmial.com', 'hotmail.com'],
  ['hotnail.com', 'hotmail.com'],
  ['icloud.con', 'icloud.com'],
  ['outlok.com', 'outlook.com'],
  ['outllok.com', 'outlook.com'],
  ['oulook.com', 'outlook.com'],
  ['yaho.com', 'yahoo.com'],
  ['yahoo.co', 'yahoo.com'],
  ['yahoo.con', 'yahoo.com'],
  ['yhoo.com', 'yahoo.com']
]);
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

function getSendGridEmailValidationApiKey() {
  return process.env.SENDGRID_EMAIL_VALIDATION_API_KEY || null;
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

function buildResetPasswordUrl(token) {
  const baseUrl = getBaseUrl().replace(/\/+$/, '');
  return `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
}

function createVerificationFields() {
  return {
    verificationToken: crypto.randomBytes(32).toString('hex'),
    verificationExpiresAt: new Date(Date.now() + VERIFICATION_TTL_MS)
  };
}

function createPasswordResetFields() {
  return {
    resetPasswordToken: crypto.randomBytes(32).toString('hex'),
    resetPasswordExpiresAt: new Date(Date.now() + RESET_PASSWORD_TTL_MS)
  };
}

function buildValidationResult(overrides = {}) {
  return {
    checked: true,
    isInvalid: false,
    message: '',
    suggestion: '',
    source: 'local',
    ...overrides
  };
}

function splitEmailAddress(email) {
  const parts = String(email || '').trim().toLowerCase().split('@');
  if (parts.length !== 2) {
    return null;
  }

  const [localPart, domain] = parts;
  return {
    localPart,
    domain
  };
}

function hasValidBasicEmailSyntax(localPart, domain) {
  if (!localPart || !domain) {
    return false;
  }

  if (localPart.length > 64 || domain.length > 255) {
    return false;
  }

  if (localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) {
    return false;
  }

  if (domain.includes('..') || !domain.includes('.')) {
    return false;
  }

  const labels = domain.split('.');
  if (labels.some((label) => !label || label.startsWith('-') || label.endsWith('-'))) {
    return false;
  }

  const basicPattern = /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9-]+(?:\.[A-Z0-9-]+)+$/i;
  return basicPattern.test(`${localPart}@${domain}`);
}

function getSuggestedEmail(localPart, domain) {
  const suggestedDomain = COMMON_DOMAIN_SUGGESTIONS.get(domain);
  if (!suggestedDomain) {
    return '';
  }

  return `${localPart}@${suggestedDomain}`;
}

async function hasResolvableMailDomain(domain) {
  try {
    const mxRecords = await dns.resolveMx(domain);
    if (mxRecords.length > 0) {
      return true;
    }
  } catch (error) {
    if (!['ENOTFOUND', 'ENODATA', 'ESERVFAIL', 'ETIMEOUT', 'EAI_AGAIN'].includes(error.code)) {
      throw error;
    }
  }

  try {
    const ipv4Addresses = await dns.resolve4(domain);
    if (ipv4Addresses.length > 0) {
      return true;
    }
  } catch (error) {
    if (!['ENOTFOUND', 'ENODATA', 'ESERVFAIL', 'ETIMEOUT', 'EAI_AGAIN'].includes(error.code)) {
      throw error;
    }
  }

  try {
    const ipv6Addresses = await dns.resolve6(domain);
    if (ipv6Addresses.length > 0) {
      return true;
    }
  } catch (error) {
    if (!['ENOTFOUND', 'ENODATA', 'ESERVFAIL', 'ETIMEOUT', 'EAI_AGAIN'].includes(error.code)) {
      throw error;
    }
  }

  return false;
}

async function runLocalEmailValidation(email) {
  const splitAddress = splitEmailAddress(email);
  if (!splitAddress) {
    return buildValidationResult({
      isInvalid: true,
      message: 'Please enter a valid email address.'
    });
  }

  const { localPart, domain } = splitAddress;
  if (!hasValidBasicEmailSyntax(localPart, domain)) {
    return buildValidationResult({
      isInvalid: true,
      message: 'Please enter a valid email address.'
    });
  }

  const suggestedEmail = getSuggestedEmail(localPart, domain);
  if (suggestedEmail) {
    return buildValidationResult({
      isInvalid: true,
      suggestion: suggestedEmail,
      message: `That email domain looks misspelled. Did you mean ${suggestedEmail}?`
    });
  }

  if (RESERVED_TEST_DOMAINS.has(domain) || domain.endsWith('.invalid') || domain.endsWith('.test')) {
    return buildValidationResult({
      isInvalid: true,
      message: 'That email domain is only for testing and cannot receive email.'
    });
  }

  try {
    const hasMailDomain = await hasResolvableMailDomain(domain);
    if (!hasMailDomain) {
      return buildValidationResult({
        isInvalid: true,
        message: 'That email domain does not appear to accept email. Please double-check it.'
      });
    }
  } catch (error) {
    console.warn(`[email validation] DNS lookup failed for ${domain}: ${error.message}`);
    return buildValidationResult({
      checked: false,
      isInvalid: false,
      source: 'local',
      reason: error.message
    });
  }

  return buildValidationResult();
}

async function validateEmailAddress(email) {
  const localValidation = await runLocalEmailValidation(email);
  if (localValidation.isInvalid || !localValidation.checked) {
    return localValidation;
  }

  const apiKey = getSendGridEmailValidationApiKey();
  if (!apiKey) {
    return localValidation;
  }

  try {
    const response = await fetch(SENDGRID_EMAIL_VALIDATION_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        source: 'Garage Jam Signup'
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.warn(`[email validation] SendGrid validation request failed (${response.status}): ${errorBody}`);
      return {
        checked: false,
        isInvalid: false,
        reason: `SendGrid validation request failed with status ${response.status}.`
      };
    }

    const payload = await response.json();
    const result = payload?.result || {};
    const verdict = String(result?.verdict || '').toLowerCase();
    const suggestion = String(result?.suggestion || '').trim();
    const hasValidSyntax = result?.checks?.domain?.has_valid_address_syntax;
    const hasMxOrARecord = result?.checks?.domain?.has_mx_or_a_record;
    const hasKnownBounces = result?.checks?.additional?.has_known_bounces;

    const isInvalid = verdict === 'invalid'
      || hasValidSyntax === false
      || hasMxOrARecord === false
      || hasKnownBounces === true;

    const suggestionMessage = suggestion ? ` Did you mean ${suggestion}?` : '';

    return {
      checked: true,
      isInvalid,
      message: isInvalid ? `That email address appears not to exist or receive email.${suggestionMessage}`.trim() : '',
      verdict,
      suggestion,
      hasValidSyntax,
      hasMxOrARecord,
      hasKnownBounces,
      source: 'sendgrid'
    };
  } catch (error) {
    console.warn(`[email validation] SendGrid validation request errored: ${error.message}`);
    return localValidation;
  }
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

async function sendPasswordResetEmail(email, token) {
  const resetPasswordUrl = buildResetPasswordUrl(token);
  const sendGridConfig = getSendGridConfig();
  const mailConfig = getMailConfig();
  const transporter = sendGridConfig ? null : await getTransporter();

  if (sendGridConfig) {
    configureSendGrid(sendGridConfig);

    await sgMail.send({
      to: email,
      from: getSendGridFrom(sendGridConfig),
      subject: 'Reset your Garage Jam password',
      text: `You requested a Garage Jam password reset.\n\nOpen this link to choose a new password:\n${resetPasswordUrl}\n\nThis link expires in 1 hour. If you did not request this, you can ignore this email.`,
      html: [
        '<p>You requested a <strong>Garage Jam</strong> password reset.</p>',
        `<p>Open this link to choose a new password:</p><p><a href="${resetPasswordUrl}">${resetPasswordUrl}</a></p>`,
        '<p>This link expires in 1 hour. If you did not request this, you can ignore this email.</p>'
      ].join('')
    });

    console.log(`[password reset] Sent password reset email to ${email} via SendGrid`);
    return { resetPasswordUrl, delivery: 'sendgrid' };
  }

  if (!mailConfig || !transporter) {
    console.log(`[password reset] Send password reset email to ${email}`);
    console.log(`[password reset] Reset link: ${resetPasswordUrl}`);
    console.log('[password reset] SMTP is not configured, so the link was logged instead of emailed.');
    return { resetPasswordUrl, delivery: 'logged' };
  }

  await transporter.sendMail({
    from: mailConfig.from,
    to: email,
    subject: 'Reset your Garage Jam password',
    text: `You requested a Garage Jam password reset.\n\nOpen this link to choose a new password:\n${resetPasswordUrl}\n\nThis link expires in 1 hour. If you did not request this, you can ignore this email.`,
    html: [
      '<p>You requested a <strong>Garage Jam</strong> password reset.</p>',
      `<p>Open this link to choose a new password:</p><p><a href="${resetPasswordUrl}">${resetPasswordUrl}</a></p>`,
      '<p>This link expires in 1 hour. If you did not request this, you can ignore this email.</p>'
    ].join('')
  });

  console.log(`[password reset] Sent password reset email to ${email}`);
  return { resetPasswordUrl, delivery: 'email' };
}

module.exports = {
  createVerificationFields,
  createPasswordResetFields,
  validateEmailAddress,
  sendVerificationEmail,
  sendPasswordResetEmail,
  buildVerificationUrl,
  buildResetPasswordUrl,
  VERIFICATION_TTL_MS,
  RESET_PASSWORD_TTL_MS
};
