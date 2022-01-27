const { totp } = require('otplib')

// Tokens valid for 10 mins
totp.options = { step: 10 * 60 } // seconds

/**
 * Generate a time-based one-time password
 * @param {string} secret - A secret string
 */
function generateTOTP (secret) {
  const token = totp.generate(secret)
  console.log('Generated TOTP for', secret, token)
  return token
}

/**
 * Verify a time-based one-time password
 * @param {string} token - The time-based one-time password (TOTP)
 * @param {string} secret - A secret string
 */
function verifyTOTP (token, secret) {
  const isValid = totp.check(token, secret)
  console.log('Verified TOTP for', secret, token, isValid)
  return isValid
}

module.exports = { generateTOTP, verifyTOTP }
