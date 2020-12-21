const joi = require('joi')
const { getSubscriptions, removeSubscription } = require('../lib/db')

module.exports = [
  {
    method: 'GET',
    path: '/contact',
    handler: async (request, h) => {
      const { credentials } = request.auth
      const { contact, contactId } = credentials
      const locations = await getSubscriptions(contactId)
      const rows = locations.map(({ id, name, location_id: locationId }) => ([
        { text: name },
        {
          html: `
            <form method="post">
              <input type="hidden" name="locationId" value="${locationId}" />
              <input type="hidden" name="name" value="${name}" />
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
      const { payload, auth } = request
      const { locationId, name, confirm } = payload

      if (confirm) {
        const { credentials } = auth
        const { contactId } = credentials
        await removeSubscription(contactId, locationId)

        return h.redirect('/contact')
      } else {
        return h.view('confirm-remove', { locationId, name })
      }
    },
    options: {
      validate: {
        payload: joi.object().keys({
          name: joi.string().required(),
          locationId: joi.string().guid().required(),
          confirm: joi.boolean().optional()
        })
      }
    }
  }
]
