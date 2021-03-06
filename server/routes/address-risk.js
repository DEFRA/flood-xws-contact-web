const { insertContactLocation } = require('../lib/db')
const { findAreasByPoint } = require('../lib/area')
const { Errors } = require('../models/form')
const { ViewModel } = require('../models/search')

module.exports = [
  {
    method: 'GET',
    path: '/address-risk',
    handler: async (request, h) => {
      const address = request.yar.get('address')

      if (!address) {
        return h.redirect('/postcode')
      }

      const { address: name, x, y } = address

      const result = await findAreasByPoint(x, y)

      const { auth } = request
      const { isAuthenticated } = auth

      if (!result.length) {
        return h.view('address-no-risk', { name, isAuthenticated })
      }

      return h.view('address-risk', { name, isAuthenticated })
    },
    options: {
      auth: {
        mode: 'try'
      }
    }
  },
  {
    method: 'POST',
    path: '/address-risk',
    handler: async (request, h) => {
      const { auth } = request
      const { isAuthenticated } = auth
      const address = request.yar.get('address')

      if (!address) {
        return h.redirect('/postcode')
      }

      if (isAuthenticated) {
        const { id } = auth.credentials

        await insertContactLocation(id, address.uprn, address)

        return h.redirect('/locations')
      } else {
        // Set confirmed address to session
        request.yar.set('confirmed-address', address)

        return h.redirect('/email')
      }
    },
    options: {
      auth: {
        mode: 'try'
      },
      validate: {
        failAction: (request, h, err) => {
          const addresses = request.yar.get('addresses')
          const errors = Errors.fromJoi(err)
          const data = { ...request.payload, ...request.query }
          const model = new ViewModel(data, errors, addresses)

          return h.view('search', model).takeover()
        }
      }
    }
  }
]
