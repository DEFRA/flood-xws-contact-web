const routes = [].concat(
  require('../routes/home'),
  require('../routes/contact-type'),
  require('../routes/telephone'),
  require('../routes/email'),
  require('../routes/verify'),
  require('../routes/find-location'),
  require('../routes/add-location'),
  require('../routes/edit-location'),
  require('../routes/england-only'),
  require('../routes/address'),
  require('../routes/contact'),
  require('../routes/status'),
  require('../routes/public'),
  require('../routes/logout')
)

module.exports = {
  plugin: {
    name: 'router',
    register: (server, options) => {
      server.route(routes)
    }
  }
}
