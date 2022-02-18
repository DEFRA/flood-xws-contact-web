const { findLocation, insertLocation, insertContactLocation } = require('../lib/db')
const { findAreasByPoint } = require('../lib/area')
const { point } = require('../lib/proj')
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

      const { address: name } = address

      const [x, y] = point(address.x, address.y)

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
        const { uprn: ref, address: name, x, y } = address
        let location = await findLocation(ref)

        if (!location) {
          location = await insertLocation(ref, name, x, y)
        }

        await insertContactLocation(id, location.id)

        return h.redirect('/locations')
      } else {
        // Clear session
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
