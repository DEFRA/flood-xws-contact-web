const joi = require('joi')
const BaseModel = require('flood-xws-common/view/model')
const { getMappedErrors } = require('flood-xws-common/view/errors')
const { updateContactLandlineActive } = require('../lib/db')

const errorMessages = {
  consent: {
    '*': 'Choose an option'
  }
}

const schema = {
  consent: joi.boolean().required()
}

class Model extends BaseModel {
  constructor (data, err) {
    super(data, err, errorMessages)
  }
}

module.exports = [
  {
    method: 'GET',
    path: '/consent-landline',
    handler: (request, h) => {
      return h.view('consent-landline', new Model())
    }
  },
  {
    method: 'POST',
    path: '/consent-landline',
    handler: async (request, h) => {
      const credentials = request.auth.credentials
      const consent = request.payload.consent

      // Update contact
      const contact = await updateContactLandlineActive(credentials.contact.id, consent)

      request.cookieAuth.set({ contact })

      const next = contact.landline_active && !contact.landline
        ? '/landline'
        : '/account'

      return h.redirect(next)
    },
    options: {
      validate: {
        payload: joi.object().keys(schema),
        failAction: (request, h, err) => {
          const { payload } = request
          const errors = getMappedErrors(err, errorMessages)
          return h.view('consent-landline', new Model({ ...payload }, errors)).takeover()
        }
      }
    }
  }
]
