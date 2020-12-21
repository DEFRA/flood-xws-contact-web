const joi = require('joi')
const BaseModel = require('xws-shared/view/model')
const { getSubscription, updateSubscription } = require('../lib/db')

module.exports = [
  {
    method: 'GET',
    path: '/edit-location/{id}',
    handler: async (request, h) => {
      const { id: subscriptionId } = request.params
      const { credentials } = request.auth
      const { contact, contactId } = credentials
      const location = await getSubscription(contactId, subscriptionId)

      const { hasWarning, wnlif, alerts } = location

      const items = [
        {
          name: 'wnlif',
          value: true,
          checked: wnlif,
          text: 'Send a message when flooding is no longer expected.'
        }
      ]

      if (hasWarning) {
        items.unshift({
          name: 'alerts',
          value: true,
          checked: alerts,
          text: 'Send a message for minor flooding affecting low lying or undefended areas, including roads.'
        })
      }

      return h.view('edit-location', new BaseModel({ ...location, contact, hasWarning, items }))
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
      const { wnlif, alerts } = request.payload
      const { credentials } = request.auth
      const { contactId } = credentials

      await updateSubscription(contactId, subscriptionId, wnlif, alerts)

      return h.redirect('/contact')
    },
    options: {
      validate: {
        payload: joi.object().keys({
          wnlif: joi.boolean().default(false).optional(),
          alerts: joi.boolean().default(false).optional()
        }),
        params: joi.object().keys({
          id: joi.string().guid().required()
        })
      }
    }
  }
]
