const joi = require('joi')
const BaseModel = require('xws-shared/view/model')
const { getMappedErrors } = require('xws-shared/view/errors')

const errorMessages = {
  contactType: 'Choose a valid contact type'
}

const querySchema = {
  signin: joi.boolean().truthy('').optional().default(false)
}

const schema = {
  contactType: joi.string().valid('phone', 'email').required()
}

class Model extends BaseModel {
  constructor (data, err) {
    super(data, err, errorMessages)
  }
}

module.exports = [
  {
    method: 'GET',
    path: '/contact-type',
    handler: async (request, h) => {
      const { signin } = request.query

      return h.view('contact-type', new Model({ signin }))
    },
    options: {
      auth: {
        mode: 'try'
      },
      validate: {
        query: joi.object().keys(querySchema)
      }
    }
  },
  {
    method: 'POST',
    path: '/contact-type',
    handler: (request, h) => {
      const { payload } = request
      const { contactType } = payload

      const next = contactType === 'phone'
        ? '/telephone'
        : '/email'

      return h.redirect(next)
    },
    options: {
      auth: {
        mode: 'try'
      },
      validate: {
        query: joi.object().keys(querySchema),
        payload: joi.object().keys(schema),
        failAction: (request, h, err) => {
          const { payload, query } = request
          const errors = getMappedErrors(err, errorMessages)

          return h.view('contact-type', new Model({ ...payload, ...query }, errors)).takeover()
        }
      }
    }
  }
]
