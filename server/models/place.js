const joi = require('joi')
const { BaseViewModel, baseMessages } = require('./form')

const PAGE_HEADING = 'Select a place name'
const PLACE_KEY = 'place'
const PLACE_LABEL = 'Place'
const PLACE_MESSAGES = {
  'number.base': PAGE_HEADING
}

const schema = joi.object().keys({
  [PLACE_KEY]: joi.number().label(PLACE_LABEL).required().messages(PLACE_MESSAGES),
  name: joi.string().required()
}).messages(baseMessages).required()

class ViewModel extends BaseViewModel {
  constructor (data, err, places) {
    super(data, err, {
      pageHeading: PAGE_HEADING,
      path: '/location'
    })

    const defaultOption = {
      text: places.length === 1
        ? '1 place found'
        : `${places.length} places found`
    }

    const items = [defaultOption].concat(places.map((addr, i) => ({
      text: [addr.name, addr.county, addr.district, addr.postcodeDistrict].filter(p => p).join(', '),
      value: i
    })))

    this.addField(PLACE_KEY, {
      id: PLACE_KEY,
      name: PLACE_KEY,
      label: {
        text: PAGE_HEADING,
        isPageHeading: false
      },
      items,
      value: this.data.place,
      errorMessage: this.errors.place
    })
  }
}

module.exports = {
  schema,
  ViewModel,
  PLACE_KEY
}
