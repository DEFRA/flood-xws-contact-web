const joi = require('joi')
const { BaseViewModel, baseMessages } = require('./form')

const PAGE_HEADING = 'Manage your warnings'
const EMAIL_KEY = 'email'
const EMAIL_LABEL = 'Email address'
const EMAIL_MESSAGES = {
  'string.empty': 'Enter an email address',
  'string.email': 'Enter a valid email address'
}

const schema = joi.object().keys({
  [EMAIL_KEY]: joi.string().label(EMAIL_LABEL).trim().lowercase()
    .email().required().messages(EMAIL_MESSAGES)
}).messages(baseMessages).required()

class ViewModel extends BaseViewModel {
  constructor (data, err) {
    super(data, err, {
      pageHeading: PAGE_HEADING,
      path: '/email'
    })

    this.addField(EMAIL_KEY, {
      id: EMAIL_KEY,
      name: EMAIL_KEY,
      label: {
        text: EMAIL_LABEL
      },
      // hint: {
      //   text: 'You will need access to the email, as we will send you a code.'
      // },
      classes: 'govuk-input--width-20',
      type: 'email',
      autocomplete: 'email',
      attributes: {
        spellcheck: false
      },
      value: this.data.email,
      errorMessage: this.errors.email
    })
  }
}

module.exports = {
  schema,
  ViewModel
}
