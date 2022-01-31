const joi = require('joi')
const { BaseViewModel, baseMessages } = require('./form')

const PAGE_HEADING = 'Search for a location'
const LOCATION_KEY = 'location'
const LOCATION_LABEL = 'Location'
const LOCATION_MESSAGES = {
  'string.empty': 'Enter a place name or postcode in England'
}

const schema = joi.object().keys({
  [LOCATION_KEY]: joi.string().label(LOCATION_LABEL).trim().required().messages(LOCATION_MESSAGES)
}).messages(baseMessages).required()

class ViewModel extends BaseViewModel {
  constructor (data, err) {
    super(data, err, {
      pageHeading: PAGE_HEADING,
      path: '/location'
    })

    this.addField(LOCATION_KEY, {
      id: LOCATION_KEY,
      name: LOCATION_KEY,
      label: {
        text: PAGE_HEADING,
        classes: 'govuk-label--l',
        isPageHeading: true
      },
      hint: {
        html: 'Enter a postcode or the name of a village, town or city and we will check to see if we monitor the location.'
      },
      classes: 'govuk-input--width-20',
      attributes: {
        placeholder: 'E.g. Weymouth or SW1A 1AA'
      },
      value: this.data.location,
      errorMessage: this.errors.location
    })
  }
}

module.exports = {
  schema,
  ViewModel,
  LOCATION_KEY
}
