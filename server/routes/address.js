const joi = require('joi')
const BaseModel = require('flood-xws-common/view/model')
const { postcodeRegex } = require('../lib/postcode')
const { redirectToCountry } = require('../lib/england-only')
const { findByPostcode } = require('../lib/location')

const errorMessages = {
  address: 'Select an address'
}

class Model extends BaseModel {
  constructor (data, err) {
    super(data, err, errorMessages)

    const addresses = data.addresses
    const defaultOption = {
      text: addresses.length === 1
        ? '1 address found'
        : `${addresses.length} addresses found`
    }

    const items = [defaultOption].concat(addresses.map(addr => ({
      text: addr.address,
      value: addr.uprn
    })))

    this.items = items
  }
}

module.exports = [
  {
    method: 'GET',
    path: '/address',
    handler: async (request, h) => {
      const { postcode } = request.query

      // The Address service doesn't support NI addresses
      // but all NI postcodes start with BT so redirect to
      // "england-only" page if that's the case.
      if (postcode.toUpperCase().startsWith('BT')) {
        return redirectToCountry(h, postcode, 'northern-ireland')
      }

      const addresses = await findByPostcode(postcode)

      if (!addresses || !addresses.length) {
        return h.view('address', new Model({ postcode }))
      }

      return h.view('address', new Model({ postcode, addresses }))
    },
    options: {
      description: 'Get the address page',
      // plugins: {
      //   'hapi-rate-limit': {
      //     enabled: config.rateLimitEnabled
      //   }
      // },
      validate: {
        query: joi.object().keys({
          postcode: joi.string().trim().regex(postcodeRegex).required()
        }).required()
      }
    }
  }
]
