const { getContactById, getContactLocations } = require('../lib/db')

module.exports = [
  {
    method: 'GET',
    path: '/confirmation',
    handler: async (request, h) => {
      const { credentials } = request.auth
      const { id } = credentials
      const contact = await getContactById(id)
      const contactLocations = await getContactLocations(contact.id)

      return h.view('confirmation', { contact, contactLocations })
    }
  }
]
