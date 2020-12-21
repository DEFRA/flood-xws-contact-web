const { getState, mergeState } = require('../lib/db')

const register = async (server, options) => {
  // Decorate
  server.decorate('request', 'getState', getState)
  server.decorate('request', 'mergeState', mergeState)
}

module.exports = {
  plugin: {
    name: 'db',
    register
  }
}
