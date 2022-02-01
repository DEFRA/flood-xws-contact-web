const joi = require('joi')
const { BaseViewModel, baseMessages } = require('./form')

const PAGE_HEADING = 'Get warnings by text message?'
const CONSENT_KEY = 'consent'
const CONSENT_LABEL = 'Consent'
const CONSENT_ITEMS = [true, false]
const CONSENT_ITEM_LABELS = ['Yes', 'No']
const CONSENT_MESSAGES = {
  'any.required': 'Choose an option'
}

const schema = joi.object().keys({
  [CONSENT_KEY]: joi.boolean().label(CONSENT_LABEL)
    .valid(...CONSENT_ITEMS).required().messages(CONSENT_MESSAGES)
}).messages(baseMessages).required()

class ViewModel extends BaseViewModel {
  constructor (data, err) {
    super(data, err, {
      pageHeading: PAGE_HEADING,
      path: '/consent-mobile'
    })

    this.addField(CONSENT_KEY, {
      id: CONSENT_KEY,
      idPrefix: CONSENT_KEY,
      name: CONSENT_KEY,
      fieldset: {
        legend: {
          text: PAGE_HEADING,
          classes: 'govuk-fieldset__legend--l',
          isPageHeading: true
        }
      },
      classes: 'govuk-radios--inline',
      items: CONSENT_ITEMS.map((value, index) => ({
        value: value,
        text: CONSENT_ITEM_LABELS[index],
        checked: value === this.data[CONSENT_KEY]
      })),
      errorMessage: this.errors.consent
    })
  }
}

module.exports = {
  schema,
  ViewModel
}
