const { findByPostcode } = require('../lib/location')
const { Errors } = require('../models/form')
const { ViewModel, schema, querySchema } = require('../models/search')

module.exports = [
  {
    method: 'GET',
    path: '/search',
    handler: async (request, h) => {
      const { postcode } = request.query
      const addresses = await findByPostcode(postcode)

      request.yar.set('addresses', addresses)

      return h.view('search', new ViewModel({ postcode }, undefined, addresses))
    },
    options: {
      auth: {
        mode: 'try'
      },
      validate: {
        query: querySchema
      }
    }
  },
  {
    method: 'POST',
    path: '/search',
    handler: async (request, h) => {
      const { address } = request.payload
      const addresses = request.yar.get('addresses')
      const addr = addresses[address]
      request.yar.set('address', addr)

      return h.redirect('/address-risk')
    },
    options: {
      auth: {
        mode: 'try'
      },
      validate: {
        payload: schema,
        query: querySchema,
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
