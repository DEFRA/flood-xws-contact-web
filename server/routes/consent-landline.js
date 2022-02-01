const { Errors } = require('../models/form')
const { ViewModel, schema } = require('../models/consent-landline')
const { updateContactLandlineActive } = require('../lib/db')

module.exports = [
  {
    method: 'GET',
    path: '/consent-landline',
    handler: (request, h) => {
      const { contact } = request.auth.credentials

      return h.view('consent-landline', new ViewModel({ consent: contact.landline_active }))
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
        payload: schema,
        failAction: (request, h, err) => {
          const { payload } = request
          const errors = Errors.fromJoi(err)

          return h.view('consent-landline', new ViewModel({ ...payload }, errors)).takeover()
        }
      }
    }
  }
]
