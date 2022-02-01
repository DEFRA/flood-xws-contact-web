const joi = require('joi')
const { BaseViewModel, baseMessages, ErrorDefinition } = require('./form')

const PAGE_HEADING = 'Enter the code we have sent you'
const VERIFY_LANDLINE_KEY = 'token'
const VERIFY_LANDLINE_LABEL = 'Token'
const VERIFY_LANDLINE_MESSAGES = {
  'string.empty': 'Enter a valid code',
  'string.length': 'Enter a valid 6 digit code'
}

const customErrors = {
  incorrect: new ErrorDefinition(VERIFY_LANDLINE_KEY, 'The code you entered is incorrect'),
  lastAttempt: new ErrorDefinition(VERIFY_LANDLINE_KEY, 'The code you entered is incorrect - you have 1 attempt remaining')
}

const schema = joi.object().keys({
  [VERIFY_LANDLINE_KEY]: joi.string().length(6).label(VERIFY_LANDLINE_LABEL)
    .trim().required().messages(VERIFY_LANDLINE_MESSAGES)
}).messages(baseMessages).required()

class ViewModel extends BaseViewModel {
  constructor (data, err) {
    super(data, err, {
      pageHeading: PAGE_HEADING,
      path: '/verify-landline'
    })

    this.addField(VERIFY_LANDLINE_KEY, {
      id: VERIFY_LANDLINE_KEY,
      name: VERIFY_LANDLINE_KEY,
      label: {
        text: PAGE_HEADING,
        classes: 'govuk-label--l',
        isPageHeading: true
      },
      hint: {
        html: 'We will call with a 6 digit code to ' + this.data.raw + '.<br>It can take up to 5 minutes for your code to arrive.'
      },
      classes: 'govuk-input--width-5',
      attributes: {
        autocomplete: 'off',
        spellcheck: 'false',
        inputmode: 'numeric',
        pattern: '[0-9]*'
      },
      value: this.data.token,
      errorMessage: this.errors.token
    })
  }
}

module.exports = {
  schema,
  ViewModel,
  VERIFY_LANDLINE_KEY,
  customErrors
}
