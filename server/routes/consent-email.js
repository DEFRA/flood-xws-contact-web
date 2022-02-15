const { Errors } = require('../models/form')
const { ViewModel, schema } = require('../models/consent-email')
const { getContactById, updateContactEmailActive } = require('../lib/db')

module.exports = [
  {
    method: 'GET',
    path: '/consent-email',
    handler: async (request, h) => {
      const { id } = request.auth.credentials
      const contact = await getContactById(id)

      return h.view('consent-email', new ViewModel({ consent: contact.email_active }))
    }
  },
  {
    method: 'POST',
    path: '/consent-email',
    handler: async (request, h) => {
      const { credentials } = request.auth
      const { id } = credentials
      const consent = request.payload.consent

      // Update contact
      const contact = await updateContactEmailActive(id, consent)

      const next = contact.mobile
        ? '/account'
        : '/mob'

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
