const sessionHandler = require('../../services/session-handler')
const { schema, ViewModel } = require('../../models/about-the-smell')

module.exports = [
  {
    method: 'GET',
    path: '/signin',
    handler: (request, h) => {
      const model = new ViewModel()

      return h.view('signin', model)
    }
  },
  {
    method: 'POST',
    path: '/signin',
    handler: (request, h) => {
      sessionHandler.update(request, 'incident', request.payload)

      return h.redirect('/is-the-smell-at-home')
    },
    options: {
      validate: {
        payload: schema,
        failAction: async (request, h, err) => {
          const model = new ViewModel(request.payload, err)
          return h.view('about-the-smell', model).takeover()
        }
      }
    }
  }
]
