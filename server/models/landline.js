const joi = require('joi')
const { BaseViewModel, baseMessages, ErrorDefinition } = require('./form')

const PAGE_HEADING = 'What is your landline telephone number?'
const LANDLINE_KEY = 'landline'
const LANDLINE_LABEL = 'Landline'
const LANDLINE_MESSAGES = {
  'string.empty': 'Enter a landline number'
}

const customErrors = {
  parseError: new ErrorDefinition(LANDLINE_KEY, 'Enter a landline number in the correct format'),
  incorrectFormat: new ErrorDefinition(LANDLINE_KEY, 'Enter a landline number in the correct format')
}

const schema = joi.object().keys({
  [LANDLINE_KEY]: joi.string().label(LANDLINE_LABEL).trim().required().messages(LANDLINE_MESSAGES)
}).messages(baseMessages).required()

class ViewModel extends BaseViewModel {
  constructor (data, err) {
    super(data, err, {
      pageHeading: PAGE_HEADING,
      path: '/landline'
    })

    this.addField(LANDLINE_KEY, {
      id: LANDLINE_KEY,
      name: LANDLINE_KEY,
      label: {
        text: PAGE_HEADING,
        classes: 'govuk-label--l',
        isPageHeading: true
      },
      hint: {
        text: 'You will need access to this contact, as we will call you with a code.'
      },
      classes: 'govuk-input--width-20',
      type: 'tel',
      autocomplete: 'tel',
      attributes: {
        spellcheck: false
      },
      value: this.data.landline,
      errorMessage: this.errors.landline
    })
  }
}

module.exports = {
  schema,
  ViewModel,
  LANDLINE_KEY,
  customErrors
}
