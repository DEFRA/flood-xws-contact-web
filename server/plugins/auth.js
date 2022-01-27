const { cookie } = require('../config')

module.exports = {
  plugin: {
    name: 'auth',
    register: (server, options) => {
      // 30 mins sliding auth cookie
      server.auth.strategy('session', 'cookie', {
        cookie: {
          path: '/',
          password: cookie.password,
          isSecure: cookie.isSecure,
          ttl: 30 * 60 * 1000
        },
        keepAlive: true,
        redirectTo: '/'
      })

      server.auth.default('session')
    }
  }
}
