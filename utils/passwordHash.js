const crypto = require('crypto');

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const ITERATIONS = 100000;
const DIGEST = 'sha512';

exports.hashPassword = async function (password) {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const hash = await pbkdf2Async(password, salt);
  return `${salt}:${hash}`;
};

exports.verifyPassword = async function (password, stored) {
  if (!stored || typeof stored !== 'string' || !stored.includes(':')) {
    return false;
  }

  const [salt, savedHash] = stored.split(':');
  const currentHash = await pbkdf2Async(password, salt);
  return crypto.timingSafeEqual(Buffer.from(savedHash, 'hex'), Buffer.from(currentHash, 'hex'));
};

function pbkdf2Async(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, DIGEST, (err, derivedKey) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(derivedKey.toString('hex'));
    });
  });
}
