const { Errors } = require('../models/form')
const { ViewModel, schema } = require('../models/consent-mobile')
const { updateContactMobileActive } = require('../lib/db')

module.exports = [
  {
    method: 'GET',
    path: '/consent-mobile',
    handler: (request, h) => {
      const { contact } = request.auth.credentials

      return h.view('consent-mobile', new ViewModel({ consent: contact.mobile_active }))
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
        payload: schema,
        failAction: (request, h, err) => {
          const { payload } = request
          const errors = Errors.fromJoi(err)

          return h.view('consent-mobile', new ViewModel({ ...payload }, errors)).takeover()
        }
      }
    }
  }
]
