const { Errors } = require('../models/form')
const { ViewModel, schema } = require('../models/consent-email')
const { getContactById, updateContact } = require('../lib/db')

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
      const contact = await updateContact(id, {
        email_active: consent
      })

      const next = 'receive_messages' in contact
        ? '/account'
        : '/locations'

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
