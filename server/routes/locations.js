const { Errors } = require('../models/form')
const { ViewModel, schema } = require('../models/locations')
const { getContactById, getContactLocations, updateContactReceiveMessages } = require('../lib/db')

module.exports = [
  {
    method: 'GET',
    path: '/locations',
    handler: async (request, h) => {
      const { id } = request.auth.credentials

      const contact = await getContactById(id)
      const locations = await getContactLocations(contact.id)
      const severity = contact.receive_messages

      return h.view('locations', new ViewModel({ severity, locations }))
    }
  },
  {
    method: 'POST',
    path: '/locations',
    handler: async (request, h) => {
      const { severity } = request.payload
      const { id } = request.auth.credentials

      await updateContactReceiveMessages(id, severity)

      return h.redirect('/account')
    },
    options: {
      validate: {
        payload: schema,
        failAction: async (request, h, err) => {
          const { id } = request.auth.credentials

          const contact = await getContactById(id)
          const locations = await getContactLocations(contact.id)
          const model = new ViewModel({ locations, ...request.payload }, Errors.fromJoi(err))

          return h.view('locations', model).takeover()
        }
      }
    }
  }
]
