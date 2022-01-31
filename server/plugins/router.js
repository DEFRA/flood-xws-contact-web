const routes = [].concat(
  require('../routes/home'),
  require('../routes/email'),
  require('../routes/mobile'),
  require('../routes/landline'),
  require('../routes/verify-email'),
  require('../routes/verify-mobile'),
  require('../routes/verify-landline'),
  require('../routes/consent-email'),
  require('../routes/consent-mobile'),
  require('../routes/consent-landline'),
  require('../routes/location'),
  require('../routes/locations'),
  require('../routes/england-only'),
  require('../routes/account'),
  require('../routes/status'),
  require('../routes/public'),
  require('../routes/signout')
)

module.exports = {
  plugin: {
    name: 'router',
    register: (server, options) => {
      server.route(routes)
    }
  }
}
