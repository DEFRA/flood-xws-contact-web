const joi = require('joi')
const BaseModel = require('flood-xws-common/view/model')
const { getMappedErrors } = require('flood-xws-common/view/errors')
const { getContactLocations, updateContactReceiveMessages } = require('../lib/db')

const errorMessages = {
  severity: 'Choose which flood warnings do you need'
}

class Model extends BaseModel {
  constructor (data, err) {
    super(data, err, errorMessages)
  }
}

module.exports = [
  {
    method: 'GET',
    path: '/locations',
    handler: async (request, h) => {
      const auth = request.auth

      let locations, severity
      if (auth.isAuthenticated) {
        const { contact } = request.auth.credentials
        locations = await getContactLocations(contact.id)
        severity = contact.receive_messages
      } else {
        locations = request.yar.get('locations')

        if (!locations) {
          return h.redirect('/find-location')
        }

        severity = request.yar.get('severity')
      }

      return h.view('locations', new Model({ severity, locations }))
    },
    options: {
      auth: {
        mode: 'try'
      }
    }
  },
  {
    method: 'POST',
    path: '/locations',
    handler: async (request, h) => {
      const { severity } = request.payload

      const auth = request.auth

      if (auth.isAuthenticated) {
        let { contact } = request.auth.credentials
        contact = await updateContactReceiveMessages(contact.id, severity)
        request.cookieAuth.set({ contact })

        return h.redirect('/account')
      } else {
        request.yar.set('severity', severity)
      }

      return h.redirect('/email')
    },
    options: {
      auth: {
        mode: 'try'
      },
      validate: {
        payload: joi.object().keys({
          severity: joi.string().valid('warnings-only', 'all').required()
        }),
        failAction: (request, h, err) => {
          const locations = request.yar.get('locations')

          if (!locations) {
            return h.redirect('/find-location')
          }

          const errors = getMappedErrors(err, errorMessages)
          return h.view('locations', new Model({ locations, ...request.payload }, errors)).takeover()
        }
      }
    }
  }
]
