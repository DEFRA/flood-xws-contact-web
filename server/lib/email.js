const client = require('./notify')
const { notify } = require('../config')

async function sendEmailToken (destinationEmail, token) {
  return client
    .sendEmail(notify.templates.emailToken, destinationEmail, {
      personalisation: { code: token }
    })
}

module.exports = { sendEmailToken }
