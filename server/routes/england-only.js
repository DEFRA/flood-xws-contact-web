const joi = require('joi')

module.exports = {
  method: 'GET',
  path: '/england-only',
  handler: async (request, h) => {
    const model = {
      isWales: request.query.region === 'wales',
      isScotland: request.query.region === 'scotland',
      isNorthernIreland: request.query.region === 'northern-ireland'
    }

    return h.view('england-only', model)
  },
  options: {
    auth: {
      mode: 'try'
    },
    description: 'Get the england only page',
    validate: {
      query: joi.object().keys({
        region: joi.string().allow('', 'wales', 'northern-ireland', 'scotland'),
        query: joi.string().allow('')
      }).required()
    }
  }
}
