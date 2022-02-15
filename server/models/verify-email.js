const joi = require('joi')
const { BaseViewModel, baseMessages, ErrorDefinition } = require('./form')

const PAGE_HEADING = 'Check your email'
const VERIFY_EMAIL_KEY = 'token'
const VERIFY_EMAIL_LABEL = 'Enter the code we have sent you'
const VERIFY_EMAIL_MESSAGES = {
  'string.empty': 'Enter a valid code',
  'string.length': 'Enter a valid 6 digit code'
}

const customErrors = {
  incorrect: new ErrorDefinition(VERIFY_EMAIL_KEY, 'The code you entered is incorrect'),
  lastAttempt: new ErrorDefinition(VERIFY_EMAIL_KEY, 'The code you entered is incorrect - you have 1 attempt remaining')
}

const schema = joi.object().keys({
  [VERIFY_EMAIL_KEY]: joi.string().length(6).label(VERIFY_EMAIL_LABEL)
    .trim().required().messages(VERIFY_EMAIL_MESSAGES)
}).messages(baseMessages).required()

class ViewModel extends BaseViewModel {
  constructor (data, err) {
    super(data, err, {
      pageHeading: PAGE_HEADING,
      path: '/verify-email'
    })

    this.addField(VERIFY_EMAIL_KEY, {
      id: VERIFY_EMAIL_KEY,
      name: VERIFY_EMAIL_KEY,
      label: {
        text: PAGE_HEADING,
        classes: 'govuk-label--l',
        isPageHeading: true
      },
      hint: {
        html: `To make sure we have the right email address we sent a code to ${this.data.raw}.`
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
  VERIFY_EMAIL_KEY,
  customErrors
}
