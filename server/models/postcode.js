const joi = require('joi')
const { BaseViewModel, baseMessages } = require('./form')
const { postcodeRegex } = require('../lib/postcode')

const PAGE_HEADING = 'Search for a location'
const POSTCODE_KEY = 'postcode'
const POSTCODE_LABEL = 'Postcode'
const POSTCODE_MESSAGES = {
  'string.empty': 'Enter a postcode',
  'string.pattern.base': 'Enter a real postcode'
}

const schema = joi.object().keys({
  [POSTCODE_KEY]: joi.string().required().trim().pattern(postcodeRegex)
    .label(POSTCODE_LABEL).messages(POSTCODE_MESSAGES)
}).messages(baseMessages).required()

class ViewModel extends BaseViewModel {
  constructor (data, err) {
    super(data, err, {
      pageHeading: PAGE_HEADING,
      path: '/postcode'
    })

    this.addField(POSTCODE_KEY, {
      id: POSTCODE_KEY,
      name: POSTCODE_KEY,
      label: {
        text: POSTCODE_LABEL,
        isPageHeading: false
      },
      classes: 'govuk-input--width-10',
      value: this.data[POSTCODE_KEY],
      errorMessage: this.errors[POSTCODE_KEY]
    })
  }
}

module.exports = {
  schema,
  ViewModel,
  POSTCODE_KEY
}
