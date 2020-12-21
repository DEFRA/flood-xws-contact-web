const joi = require('joi')
const BaseModel = require('xws-shared/view/model')
const { getMappedErrors } = require('xws-shared/view/errors')
const { postcodeRegex } = require('../lib/postcode')
const { redirectToCountry } = require('../lib/england-only')
const { findByPostcode, findByName } = require('../lib/location')
const { point, bbox } = require('../lib/proj')

const errorMessages = {
  location: 'Enter a place name or postcode in England',
  address: 'Select an address',
  place: 'Select a place name'
}

const locationSchema = {
  location: joi.string().required()
}

const addressSchema = joi.object().keys({
  address: joi.string().required(),
  addresses: joi.string().required(),
  postcode: joi.string().trim().regex(postcodeRegex).required()
})

const placeSchema = joi.object().keys({
  place: joi.string().required(),
  places: joi.string().required(),
  name: joi.string().required()
})

class LocationModel extends BaseModel {
  constructor (data, err) {
    super(data, err, {
      location: errorMessages.location
    })
  }
}

class AddressModel extends BaseModel {
  constructor (data, err) {
    super(data, err, {
      address: errorMessages.address
    })

    const { addresses } = this.data
    const defaultOption = {
      text: addresses.length === 1
        ? '1 address found'
        : `${addresses.length} addresses found`
    }

    const items = [defaultOption].concat(addresses.map(addr => ({
      text: addr.address,
      value: addr.uprn
    })))

    this.items = items
  }
}

class PlaceModel extends BaseModel {
  constructor (data, err) {
    super(data, err, {
      place: errorMessages.place
    })

    const { places } = this.data
    const defaultOption = {
      text: places.length === 1
        ? '1 place found'
        : `${places.length} places found`
    }

    const items = [defaultOption].concat(places.map(addr => ({
      text: [addr.name, addr.county, addr.district, addr.postcodeDistrict].filter(p => p).join(', '),
      value: addr.id
    })))

    this.items = items
  }
}

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

    if (!addresses || !addresses.length) {
      return h.view('address', new AddressModel({ postcode }))
    }

    return h.view('address', new AddressModel({ postcode, addresses }))
  } else {
    const name = location
    const places = await findByName(name)
    const englishPlaces = places.filter(place => place.country === 'England')

    if (!englishPlaces.length) {
      if (places.length) {
        // We have addresses but none in England
        const firstPlaceCountry = places[0].country
        const countries = {
          Scotland: 'scotland',
          Wales: 'wales'
        }

        return redirectToCountry(h, location, countries[firstPlaceCountry])
      }
    }

    return h.view('place', new PlaceModel({ name, places: englishPlaces }))
  }
}

const addressHandler = async (request, h) => {
  const { address } = request.payload
  const addresses = JSON.parse(request.payload.addresses)
  const addr = addresses.find(a => a.uprn === address)
  const { uprn: id, address: name } = addr
  const [x, y] = point(addr.x, addr.y)

  request.yar.set('location', { id, name, x, y })

  return h.redirect('/add-location')
}

const placeHandler = async (request, h) => {
  const { place } = request.payload
  const places = JSON.parse(request.payload.places)
  const addr = places.find(a => a.id === place)
  const { id, name } = addr
  const [x, y] = point(addr.x, addr.y)
  const [xmin, ymin, xmax, ymax] = bbox(addr.xmin, addr.ymin, addr.xmax, addr.ymax)

  request.yar.set('location', { id, name, x, y, xmin, ymin, xmax, ymax })

  return h.redirect('/add-location')
}

const addressFailAction = (request, h, err) => {
  const { postcode } = request.payload
  const addresses = JSON.parse(request.payload.addresses)
  const errors = getMappedErrors(err, errorMessages)

  return h.view('address', new AddressModel({ postcode, addresses }, errors)).takeover()
}

const placeFailAction = (request, h, err) => {
  const { name } = request.payload
  const places = JSON.parse(request.payload.places)
  const errors = getMappedErrors(err, errorMessages)
  return h.view('place', new PlaceModel({ name, places }, errors)).takeover()
}

module.exports = [
  {
    method: 'GET',
    path: '/find-location',
    handler: (request, h) => {
      return h.view('find-location', new LocationModel())
    }
  },
  {
    method: 'POST',
    path: '/find-location',
    handler: async (request, h) => {
      const form = request.payload._form

      switch (form) {
        case 'location': return locationHandler(request, h)
        case 'address': return addressHandler(request, h)
        case 'place': return placeHandler(request, h)
        default:
          return h.redirect('/find-location')
      }
    },
    options: {
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
              const errors = getMappedErrors(err, errorMessages)
              return h.view('find-location', new LocationModel(request.payload, errors)).takeover()
            }
          }
        }
      }
    }
  }
]
