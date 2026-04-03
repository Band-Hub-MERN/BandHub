const crypto = require('crypto');

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

function getBaseUrl() {
  return process.env.APP_BASE_URL || 'http://localhost:5173';
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

  // First-pass implementation: if no mail provider is configured yet,
  // log the verification URL so the flow still works during development.
  console.log(`[email verification] Send verification email to ${email}`);
  console.log(`[email verification] Verification link: ${verificationUrl}`);

  return { verificationUrl };
}

module.exports = {
  createVerificationFields,
  sendVerificationEmail,
  buildVerificationUrl,
  VERIFICATION_TTL_MS
};
