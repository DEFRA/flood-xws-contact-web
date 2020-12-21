const twilio = require('./twilio')
const notify = require('./notify')
const config = require('../config')

/**
 * Send an OTP via SMS
 *
 * @param {string} phoneNumber - The parsed and validated phone number
 * @param {string} token - The time-based one-time password (TOTP)
 */
async function sendSMSToken (phoneNumber, token) {
  return notify
    .sendSms(config.notify.templates.smsToken, phoneNumber, {
      personalisation: { code: token }
    })
}

/**
 * Send an OTP via voice call
 *
 * @param {string} phoneNumber - The phone number
 * @param {string} token - The time-based one-time password (TOTP)
 */
async function sendVoiceToken (phoneNumber, token) {
  const attrs = 'voice="alice" language="en-gb"'

  return twilio.calls
    .create({
      twiml: `
      <Response>
        <Say ${attrs}>Your code for the flood warning service is</Say>
        <break strength="medium" />
        ${token.split('').map(d => `<Say ${attrs}>${d}</Say><break strength="medium" />`)}
      </Response>`,
      to: phoneNumber,
      from: config.twilio.fromPhoneNumber
    })
}

module.exports = {
  sendSMSToken,
  sendVoiceToken
}
