const joi = require('joi')
const { BaseViewModel, baseMessages, ErrorDefinition } = require('./form')

const PAGE_HEADING = 'What is your mobile number?'
const MOBILE_KEY = 'mobile'
const MOBILE_LABEL = 'Mobile'
const MOBILE_MESSAGES = {
  'string.empty': 'Enter a mobile number'
}

const customErrors = {
  parseError: new ErrorDefinition(MOBILE_KEY, 'Enter a mobile number in the correct format'),
  incorrectFormat: new ErrorDefinition(MOBILE_KEY, 'Enter a mobile number in the correct format')
}

const schema = joi.object().keys({
  [MOBILE_KEY]: joi.string().label(MOBILE_LABEL).trim().required().messages(MOBILE_MESSAGES)
}).messages(baseMessages).required()

class ViewModel extends BaseViewModel {
  constructor (data, err) {
    super(data, err, {
      pageHeading: PAGE_HEADING,
      path: '/mobile'
    })

    this.addField(MOBILE_KEY, {
      id: MOBILE_KEY,
      name: MOBILE_KEY,
      label: {
        text: PAGE_HEADING,
        classes: 'govuk-label--l',
        isPageHeading: true
      },
      hint: {
        text: 'You will need access to this contact, as we will send you a code.'
      },
      classes: 'govuk-input--width-20',
      type: 'tel',
      autocomplete: 'tel',
      attributes: {
        spellcheck: false
      },
      value: this.data.mobile,
      errorMessage: this.errors.mobile
    })
  }
}

module.exports = {
  schema,
  ViewModel,
  MOBILE_KEY,
  customErrors
}
