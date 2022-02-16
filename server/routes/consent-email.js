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
      const data = { email: contact.email, consent: contact.email_active }

      return h.view('consent-email', new ViewModel(data))
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

      const next = contact.receive_messages === null
        ? '/locations'
        : '/account'

      return h.redirect(next)
    },
    options: {
      validate: {
        payload: schema,
        failAction: async (request, h, err) => {
          const { payload } = request
          const errors = Errors.fromJoi(err)
          const { id } = request.auth.credentials
          const contact = await getContactById(id)
          const data = { email: contact.email, ...payload }

          return h.view('consent-email', new ViewModel(data, errors)).takeover()
        }
      }
    }
  }
]
