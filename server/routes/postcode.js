const { Errors } = require('../models/form')
const { ViewModel, schema } = require('../models/postcode')
const { redirectToCountry } = require('../lib/england-only')

module.exports = [
  {
    method: 'GET',
    path: '/postcode',
    handler: (request, h) => {
      return h.view('postcode', new ViewModel())
    },
    options: {
      auth: {
        mode: 'try'
      }
    }
  },
  {
    method: 'POST',
    path: '/postcode',
    handler: async (request, h) => {
      const { postcode } = request.payload

      // The Address service doesn't support NI addresses
      // but all NI postcodes start with BT so redirect to
      // "england-only" page if that's the case.
      if (postcode.toUpperCase().startsWith('BT')) {
        return redirectToCountry(h, postcode, 'northern-ireland')
      }

      return h.redirect(`/search?postcode=${encodeURIComponent(postcode)}`)
    },
    options: {
      auth: {
        mode: 'try'
      },
      validate: {
        payload: schema,
        failAction: (request, h, err) => {
          return h.view('postcode', new ViewModel(request.payload, Errors.fromJoi(err))).takeover()
        }
      }
    }
  }
]
