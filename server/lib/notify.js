const { NotifyClient } = require('notifications-node-client')
const { notify } = require('../config')
const client = new NotifyClient(notify.apiKey)

module.exports = client
