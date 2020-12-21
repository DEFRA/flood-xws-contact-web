const joi = require('joi')

const makeGetHandler = (view, model) => {
  return (request, h) => {
    return h.view(view, model(request.payload))
  }
}

const makePostHandler = (view, model) => {
  return (request, h, err) => {
    return h.view(view, model(request.payload))
  }
}

const makeFailHandler = (view, model) => {
  return (request, h, err) => {
    return h.view(view, model(request.payload, err)).takeover()
  }
}

function makeFormHandlers (path, view, schema, model, getHandler, postHandler, failHandler) {
  return [
    {
      method: 'GET',
      path: `/${path}`,
      handler: (request, h) => {
        return h.view(view, model())
      }
    },
    {
      method: 'POST',
      path: `/${path}`,
      handler: (request, h) => {
        return h.view(view, model(request.payload))
      },
      options: {
        validate: {
          payload: schema.isJoi ? schema : joi.object().keys(schema),
          failAction: (request, h, err) => {
            return h.view(view, model(request.payload, err)).takeover()
          }
        }
      }
    }
  ]
}

module.exports = {
  makeFormHandlers,
  makeGetHandler,
  makePostHandler,
  makeFailHandler
}
