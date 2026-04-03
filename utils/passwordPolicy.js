exports.validatePasswordPolicy = function (password) {
  const value = String(password || '');

  const errors = [];
  if (value.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(value)) {
    errors.push('Password must include at least 1 uppercase letter');
  }
  if (!/[0-9]/.test(value)) {
    errors.push('Password must include at least 1 number');
  }
  if (!/[^A-Za-z0-9]/.test(value)) {
    errors.push('Password must include at least 1 special symbol');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
