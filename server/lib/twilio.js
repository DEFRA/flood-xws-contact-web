const twilio = require('twilio')
const config = require('../config')

module.exports = twilio(config.twilio.accountId, config.twilio.authToken, { })
