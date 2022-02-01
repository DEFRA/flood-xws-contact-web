const { Errors } = require('../models/form')
const { ViewModel, schema } = require('../models/locations')
const { getContactLocations, updateContactReceiveMessages } = require('../lib/db')

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
          return h.redirect('/location')
        }

        severity = request.yar.get('severity')
      }

      return h.view('locations', new ViewModel({ severity, locations }))
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
        payload: schema,
        failAction: (request, h, err) => {
          const locations = request.yar.get('locations')

          if (!locations) {
            return h.redirect('/location')
          }

          return h.view('locations', new ViewModel({ locations, ...request.payload }, Errors.fromJoi(err))).takeover()
        }
      }
    }
  }
]
