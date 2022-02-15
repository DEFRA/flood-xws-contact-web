const { ViewModel, paramsSchema } = require('../models/confirm-remove')
const { getContactLocation, removeContactLocation } = require('../lib/db')

module.exports = [
  {
    method: 'GET',
    path: '/confirm-remove/{id}',
    handler: async (request, h) => {
      const auth = request.auth
      const { id } = request.params

      if (auth.isAuthenticated) {
        const { contact } = request.auth.credentials
        const contactLocation = await getContactLocation(contact.id, id)

        if (!contactLocation) {
          return h.redirect('/locations')
        }

        return h.view('confirm-remove', new ViewModel(contactLocation))
      } else {
        const locations = request.yar.get('locations') || []
        const location = locations.find(l => l.id === id)

        if (!location) {
          return h.redirect('/locations')
        }

        return h.view('confirm-remove', new ViewModel(location))
      }
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

      if (auth.isAuthenticated) {
        const { contact } = request.auth.credentials
        await removeContactLocation(contact.id, id)
      } else {
        const locations = request.yar.get('locations')
        request.yar.set('locations', locations.filter(l => l.id !== id))
      }

      return h.redirect('/locations')
    },
    options: {
      validate: {
        params: paramsSchema
      }
    }
  }
]
