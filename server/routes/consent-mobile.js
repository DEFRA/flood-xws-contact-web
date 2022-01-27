const joi = require('joi')
const BaseModel = require('flood-xws-common/view/model')
const { getMappedErrors } = require('flood-xws-common/view/errors')
const { updateContactMobileActive } = require('../lib/db')

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
    path: '/consent-mobile',
    handler: (request, h) => {
      return h.view('consent-mobile', new Model())
    }
  },
  {
    method: 'POST',
    path: '/consent-mobile',
    handler: async (request, h) => {
      const credentials = request.auth.credentials
      const consent = request.payload.consent

      // Update contact
      const contact = await updateContactMobileActive(credentials.contact.id, consent)

      request.cookieAuth.set({ contact })

      const next = contact.mobile_active && !contact.mobile
        ? '/mobile'
        : '/account'

      return h.redirect(next)
    },
    options: {
      validate: {
        payload: joi.object().keys(schema),
        failAction: (request, h, err) => {
          const { payload } = request
          const errors = getMappedErrors(err, errorMessages)
          return h.view('consent-mobile', new Model({ ...payload }, errors)).takeover()
        }
      }
    }
  }
]
