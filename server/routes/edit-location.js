const joi = require('joi')
const BaseModel = require('flood-xws-common/view/model')
const { updateSubscription, getSubscription } = require('../lib/api')

module.exports = [
  {
    method: 'GET',
    path: '/edit-location/{id}',
    handler: async (request, h) => {
      const { id } = request.params
      const { credentials } = request.auth
      const { contact } = credentials
      const subscription = await getSubscription(id)

      const { wnlif } = subscription

      const items = [
        {
          name: 'wnlif',
          value: true,
          checked: wnlif,
          text: 'Send a message when flooding is no longer expected.'
        }
      ]

      return h.view('edit-location', new BaseModel({ ...subscription, contact, items }))
    },
    options: {
      validate: {
        params: joi.object().keys({
          id: joi.string().guid().required()
        })
      }
    }
  },
  {
    method: 'POST',
    path: '/edit-location/{id}',
    handler: async (request, h) => {
      const { id: subscriptionId } = request.params
      const { wnlif } = request.payload

      await updateSubscription(subscriptionId, wnlif)

      return h.redirect('/contact')
    },
    options: {
      validate: {
        payload: joi.object().keys({
          wnlif: joi.boolean().default(false).optional()
        }),
        params: joi.object().keys({
          id: joi.string().guid().required()
        })
      }
    }
  }
]
