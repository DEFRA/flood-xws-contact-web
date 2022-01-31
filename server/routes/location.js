const joi = require('joi')
const BaseModel = require('flood-xws-common/view/model')
const { postcodeRegex } = require('../lib/postcode')
const { redirectToCountry } = require('../lib/england-only')
const { findLocation, insertLocation, insertContactLocation } = require('../lib/db')
const { findByPostcode, findByName } = require('../lib/location')
const { areasIntersectBox, areasIntersectPoint } = require('../lib/area')
const { point, bbox } = require('../lib/proj')

const { ViewModel: LocationModel, schema: locationSchema } = require('../models/location')
const { ViewModel: PlaceModel, schema: placeSchema } = require('../models/place')
const { ViewModel: AddressModel, schema: addressSchema } = require('../models/address')

const locationHandler = async (request, h) => {
  const { location } = request.payload

  if (postcodeRegex.test(location)) {
    // The Address service doesn't support NI addresses
    // but all NI postcodes start with BT so redirect to
    // "england-only" page if that's the case.
    if (location.toUpperCase().startsWith('BT')) {
      return redirectToCountry(h, location, 'northern-ireland')
    }

    const postcode = location
    const addresses = await findByPostcode(postcode)

    request.yar.set('addresses', addresses)

    return h.view('address', new AddressModel({ postcode }, null, addresses))
  } else {
    const name = location
    const places = await findByName(name)
    const englishPlaces = places.filter(place => place.country === 'England')

    if (places.length && !englishPlaces.length) {
      // We have addresses but none in England
      const firstPlaceCountry = places[0].country
      const countries = {
        Scotland: 'scotland',
        Wales: 'wales'
      }

      return redirectToCountry(h, location, countries[firstPlaceCountry])
    }

    request.yar.set('places', englishPlaces)

    return h.view('place', new PlaceModel({ name }, null, englishPlaces))
  }
}

const addressHandler = async (request, h) => {
  const { address } = request.payload
  const addresses = request.yar.get('addresses', true)
  const addr = addresses[address]
  const { uprn: id, address: name } = addr
  const [x, y] = point(addr.x, addr.y)

  const result = await areasIntersectPoint(x, y)

  if (!result.exists) {
    return h.view('no-target-areas', new BaseModel({ name }))
  }

  const auth = request.auth
  if (auth.isAuthenticated) {
    const { contact } = auth.credentials
    let location = await findLocation(id)

    if (!location) {
      location = await insertLocation(id, name, x, y)
    }

    await insertContactLocation(contact.id, location.id)
  } else {
    const locations = request.yar.get('locations') || []
    locations.unshift({ id, name, x, y })
    request.yar.set('locations', locations)
  }

  return h.redirect('/locations')
}

const placeHandler = async (request, h) => {
  const places = request.yar.get('places', true)
  const place = places[request.payload.place]
  const { id, name } = place
  const [x, y] = point(place.x, place.y)
  const [xmin, ymin, xmax, ymax] = bbox(place.xmin, place.ymin, place.xmax, place.ymax)

  const result = await areasIntersectBox(xmin, ymin, xmax, ymax)

  if (!result.exists) {
    return h.view('no-target-areas', new BaseModel({ name }))
  }

  const auth = request.auth
  if (auth.isAuthenticated) {
    const { contact } = auth.credentials
    let location = await findLocation(id)

    if (!location) {
      location = await insertLocation(id, name, x, y, xmin, ymin, xmax, ymax)
    }

    await insertContactLocation(contact.id, location.id)
  } else {
    const locations = request.yar.get('locations') || []
    locations.unshift({ id, name, x, y, xmin, ymin, xmax, ymax })
    request.yar.set('locations', locations)
  }

  return h.redirect('/locations')
}

const addressFailAction = (request, h, err) => {
  const { postcode } = request.payload
  const addresses = request.yar.get('addresses')

  return h.view('address', new AddressModel({ postcode }, err, addresses)).takeover()
}

const placeFailAction = (request, h, err) => {
  const { name } = request.payload
  const places = request.yar.get('places')

  return h.view('place', new PlaceModel({ name }, err, places)).takeover()
}

module.exports = [
  {
    method: 'GET',
    path: '/location',
    handler: (request, h) => {
      return h.view('location', new LocationModel())
    },
    options: {
      auth: {
        mode: 'try'
      }
    }
  },
  {
    method: 'POST',
    path: '/location',
    handler: async (request, h) => {
      const form = request.payload._form

      switch (form) {
        case 'location': return locationHandler(request, h)
        case 'address': return addressHandler(request, h)
        case 'place': return placeHandler(request, h)
        default:
          return h.redirect('/location')
      }
    },
    options: {
      auth: {
        mode: 'try'
      },
      validate: {
        payload: joi.object({
          _form: joi.string().allow('location', 'address', 'place').required()
        }).when(joi.object({ _form: 'location' }).unknown(), { then: locationSchema })
          .when(joi.object({ _form: 'address' }).unknown(), { then: addressSchema })
          .when(joi.object({ _form: 'place' }).unknown(), { then: placeSchema }),
        failAction: (request, h, err) => {
          const form = request.payload._form

          switch (form) {
            case 'address': return addressFailAction(request, h, err)
            case 'place': return placeFailAction(request, h, err)
            default: {
              return h.view('location', new LocationModel(request.payload, err)).takeover()
            }
          }
        }
      }
    }
  }
]
