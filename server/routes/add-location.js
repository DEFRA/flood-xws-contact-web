const joi = require('joi')
const BaseModel = require('xws-shared/view/model')
const { getMappedErrors } = require('xws-shared/view/errors')

const {
  findAlertAreasByPoint,
  findWarningAreasByPoint,
  findAlertAreasByBox,
  findWarningAreasByBox
} = require('../lib/area')
const { postSubscription } = require('../lib/api')
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
        const mapper = ({ code, name, description, area_type_ref: areaTypeRef }) => {
          return { value: JSON.stringify({ code, name, areaTypeRef }), text: `${name} (${code})`, hint: { text: description }, id: code }
        }
        const faaList = faa.map(mapper)
        const fwaList = fwa.map(mapper)
        return h.view('add-location', new Model({ ...location, fwa, faa, hasAlerts, hasWarning, items, faaList, fwaList }))
      } else {
        return h.view('no-target-areas', new Model({ ...location }))
      }
    }
  },
  {
    method: 'POST',
    path: '/add-location',
    handler: async (request, h) => {
      const getAreas = (areaType) => (request.payload[areaType] || []).map(area => JSON.parse(area))
      const { wnlif } = request.payload
      const faAreas = getAreas('fa-areas')
      const fwAreas = getAreas('fw-areas')
      const areas = faAreas.concat(fwAreas)
      const auth = request.auth
      const { contactId, contactKind } = auth.credentials

      const channelName = getChannelNameFromContactKind(contactKind)
      await Promise.all(
        areas.map(async ({ code }) =>
          await postSubscription(contactId, code, channelName, wnlif)
        )
      )

      return h.redirect('/contact')
    },
    options: {
      validate: {
        payload: joi.object().keys({
          'fa-areas': joi.array().items(joi.string()).single(),
          'fw-areas': joi.array().items(joi.string()).single(),
          wnlif: joi.boolean().default(false).optional()
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
