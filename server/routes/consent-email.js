const { Errors } = require('../models/form')
const { ViewModel, schema } = require('../models/consent-email')
const { updateContactEmailActive } = require('../lib/db')

module.exports = [
  {
    method: 'GET',
    path: '/consent-email',
    handler: (request, h) => {
      const { contact } = request.auth.credentials

      return h.view('consent-email', new ViewModel({ consent: contact.email_active }))
    }
  },
  {
    method: 'POST',
    path: '/consent-email',
    handler: async (request, h) => {
      const credentials = request.auth.credentials
      const consent = request.payload.consent

      // Update contact
      const contact = await updateContactEmailActive(credentials.contact.id, consent)

      request.cookieAuth.set({ contact })

      const next = contact.mobile
        ? '/account'
        : '/consent-mobile'

      return h.redirect(next)
    },
    options: {
      validate: {
        payload: schema,
        failAction: (request, h, err) => {
          const { payload } = request
          const errors = Errors.fromJoi(err)

          return h.view('consent-email', new ViewModel({ ...payload }, errors)).takeover()
        }
      }
    }
  }
]
