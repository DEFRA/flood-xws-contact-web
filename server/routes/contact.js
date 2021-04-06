const joi = require('joi')
const { getSubscriptions, deleteSubscription } = require('../lib/api')

module.exports = [
  {
    method: 'GET',
    path: '/contact',
    handler: async (request, h) => {
      const { credentials } = request.auth
      const { contact, contactId } = credentials
      const subscriptions = await getSubscriptions(contactId)
      const rows = subscriptions.map(({ id, area: { name: areaName } }) => ([
        { text: areaName },
        {
          html: `
            <form method="post">
              <input type="hidden" name="subscriptionId" value="${id}" />
              <input type="hidden" name="name" value="${areaName}" />
              <div class="button-container">
                <a class="govuk-button govuk-button--secondary"
                  href="/edit-location/${id}"
                  style="margin-bottom: 0">Edit</a>&nbsp;
                <button class="govuk-button govuk-button--danger"
                  style="margin-bottom: 0">Remove</button>
              </div>
            </form>`
        }
      ]))

      return h.view('contact', { contact, rows })
    }
  },
  {
    method: 'POST',
    path: '/contact',
    handler: async (request, h) => {
      const { payload } = request
      const { subscriptionId, name, confirm } = payload

      if (confirm) {
        await deleteSubscription(subscriptionId)
        return h.redirect('/contact')
      } else {
        return h.view('confirm-remove', { subscriptionId, name })
      }
    },
    options: {
      validate: {
        payload: joi.object().keys({
          name: joi.string().required(),
          subscriptionId: joi.string().guid().required(),
          confirm: joi.boolean().optional()
        })
      }
    }
  }
]
