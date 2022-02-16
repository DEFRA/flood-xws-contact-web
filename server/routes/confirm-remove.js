const { ViewModel, paramsSchema } = require('../models/confirm-remove')
const { getContactLocation, removeContactLocation } = require('../lib/db')

module.exports = [
  {
    method: 'GET',
    path: '/confirm-remove/{id}',
    handler: async (request, h) => {
      const auth = request.auth
      const { id } = request.params
      const { id: contactId } = auth.credentials
      const contactLocation = await getContactLocation(contactId, id)

      if (!contactLocation) {
        return h.redirect('/locations')
      }

      return h.view('confirm-remove', new ViewModel(contactLocation))
    },
    options: {
      validate: {
        params: paramsSchema
      }
    }
  },
  {
    method: 'POST',
    path: '/confirm-remove/{id}',
    handler: async (request, h) => {
      const auth = request.auth
      const { id } = request.params

      const { id: contactId } = auth.credentials
      await removeContactLocation(contactId, id)

      return h.redirect('/locations')
    },
    options: {
      validate: {
        params: paramsSchema
      }
    }
  }
]
