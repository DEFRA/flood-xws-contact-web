const joi = require('joi')
const BaseModel = require('xws-shared/view/model')
const { getMappedErrors } = require('xws-shared/view/errors')
const {
  findLocation,
  insertLocation,
  insertSubscription,
  findAlertAreasByPoint,
  findWarningAreasByPoint,
  findAlertAreasByBox,
  findWarningAreasByBox
} = require('../lib/db')
const capabilities = require('../lib/capabilities')

const errorMessages = {
  location: 'Enter a place name or postcode in England'
}

class Model extends BaseModel {
  constructor (data, err) {
    super(data, err, {
      location: 'Enter a place name or postcode in England'
    })

    this.capabilities = capabilities
  }
}

module.exports = [
  {
    method: 'GET',
    path: '/add-location',
    handler: async (request, h) => {
      const location = request.yar.get('location')

      if (!location) {
        return h.redirect('/find-location')
      }

      const { x, y, xmin, ymin, xmax, ymax } = location
      let faa, fwa

      if (xmin) {
        faa = await findAlertAreasByBox(xmin, ymin, xmax, ymax)
        fwa = await findWarningAreasByBox(xmin, ymin, xmax, ymax)
      } else {
        faa = await findAlertAreasByPoint(x, y)
        fwa = await findWarningAreasByPoint(x, y)
      }

      const hasWarning = !!fwa.length
      const hasAlerts = !!faa.length

      if (hasAlerts || hasWarning) {
        const items = [
          {
            name: 'wnlif',
            value: true,
            text: 'Send a message when flooding is no longer expected.'
          }
        ]

        if (hasWarning) {
          items.unshift({
            name: 'alerts',
            value: true,
            text: 'Send a message for minor flooding affecting low lying or undefended areas, including roads.'
          })
        }

        return h.view('add-location', new Model({ ...location, fwa, faa, hasAlerts, hasWarning, items }))
      } else {
        return h.view('no-target-areas', new Model({ ...location }))
      }
    }
  },
  {
    method: 'POST',
    path: '/add-location',
    handler: async (request, h) => {
      const location = request.yar.get('location')

      if (!location) {
        return h.redirect('/find-location')
      }

      const auth = request.auth
      const { id: ref, name, x, y, xmin, ymin, xmax, ymax } = location
      const centroid = `{
        "type": "Point",
        "coordinates": [${x}, ${y}]
      }`

      const geom = xmin
        ? `{
          "type": "Polygon",
          "coordinates": [
            [
              [${xmin},${ymin}],
              [${xmin},${ymax}],
              [${xmax},${ymax}],
              [${xmax},${ymin}],
              [${xmin},${ymin}]]
          ]
        }`
        : centroid

      let locationRecord = await findLocation(ref)

      if (!locationRecord) {
        locationRecord = await insertLocation(ref, name, geom, centroid)
      }

      const { wnlif, alerts } = request.payload
      const { contactId, contactKind } = auth.credentials

      const channelName = getChannelNameFromContactKind(contactKind)
      await insertSubscription(contactId, locationRecord.id, channelName, wnlif, alerts)

      return h.redirect('/contact')
    },
    options: {
      validate: {
        payload: joi.object().keys({
          wnlif: joi.boolean().default(false).optional(),
          alerts: joi.boolean().default(false).optional()
        }),
        failAction: (request, h, err) => {
          const errors = getMappedErrors(err, errorMessages)
          return h.view('add-location', new Model(request.payload, errors)).takeover()
        }
      }
    }
  }
]

function getChannelNameFromContactKind (contactKind) {
  switch (contactKind) {
    case 'email':
      return 'email'
    case 'mobile':
      return 'sms'
    case 'landline':
      return 'voice'
    default:
      throw new Error('Unknown contact kind')
  }
}
