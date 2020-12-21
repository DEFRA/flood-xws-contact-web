const config = require('../config')
const wreck = require('@hapi/wreck').defaults({
  timeout: config.httpTimeoutMs
})

function get (url, options) {
  return wreck.get(url, options)
    .then(response => {
      if (response.res.statusCode !== 200) {
        throw new Error('Requested resource returned a non 200 status code')
      }
      return response.payload
    })
}

function getJson (url) {
  return get(url, { json: true })
}

module.exports = {
  get,
  getJson
}
