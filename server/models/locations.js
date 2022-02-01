const joi = require('joi')
const { BaseViewModel, baseMessages } = require('./form')

const PAGE_HEADING = 'Which flood warnings do you need?'
const SEVERITY_KEY = 'severity'
const SEVERITY_LABEL = 'Severity'
const SEVERITY_ITEMS = ['warnings-only', 'all']
const SEVERITY_ITEM_LABELS = [
  'Warnings and severe warnings',
  'All flood warnings including minor warnings'
]
const SEVERITY_ITEM_HINTS = [
  'Flooding to property or a danger to life is expected in this location.',
  'These may be shallow flooding of roads, fields and footpaths that may not be near me but may connect to waterways in this location.'
]
const SEVERITY_MESSAGES = {
  'any.required': 'Choose which flood warnings do you need'
}

const schema = joi.object().keys({
  [SEVERITY_KEY]: joi.string().label(SEVERITY_LABEL)
    .valid(...SEVERITY_ITEMS).required().messages(SEVERITY_MESSAGES)
}).messages(baseMessages).required()

class ViewModel extends BaseViewModel {
  constructor (data, err) {
    super(data, err, {
      pageHeading: PAGE_HEADING,
      path: '/locations'
    })

    this.addField(SEVERITY_KEY, {
      id: SEVERITY_KEY,
      idPrefix: SEVERITY_KEY,
      name: SEVERITY_KEY,
      fieldset: {
        legend: {
          text: PAGE_HEADING,
          classes: 'govuk-fieldset__legend--m',
          isPageHeading: false
        }
      },
      hint: {
        html: 'Enter a postcode or the name of a village, town or city and we will check to see if we monitor the location.'
      },
      items: SEVERITY_ITEMS.map((value, index) => ({
        value: value,
        text: SEVERITY_ITEM_LABELS[index],
        checked: value === this.data[SEVERITY_KEY],
        hint: {
          text: SEVERITY_ITEM_HINTS[index]
        }
      })),
      errorMessage: this.errors.severity
    })
  }
}

module.exports = {
  schema,
  ViewModel,
  SEVERITY_KEY
}
