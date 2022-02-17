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
const MOBILE_KEY = 'mobile'
const MOBILE_LABEL = 'Mobile telephone number'
const MOBILE_MESSAGES = {
  'string.empty': 'Enter a mobile number'
}

const schema = joi.object().keys({
  [CONSENT_KEY]: joi.boolean().label(CONSENT_LABEL).required().messages(CONSENT_MESSAGES),
  [MOBILE_KEY]: joi.alternatives()
    .conditional(CONSENT_KEY, {
      is: true,
      then: joi.string().label(MOBILE_LABEL).trim().required().messages(MOBILE_MESSAGES),
      otherwise: joi.strip()
    })
}).messages(baseMessages).required()

class ViewModel extends BaseViewModel {
  constructor (data, err) {
    super(data, err, {
      pageHeading: PAGE_HEADING,
      path: '/mobile'
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
      // classes: 'govuk-radios--inline',
      items: CONSENT_ITEMS.map((value, index) => ({
        value: value,
        text: CONSENT_ITEM_LABELS[index],
        checked: value === this.data[CONSENT_KEY]
      })),
      errorMessage: this.errors[CONSENT_KEY]
    })

    this.addField(MOBILE_KEY, {
      id: MOBILE_KEY,
      name: MOBILE_KEY,
      label: {
        text: MOBILE_LABEL
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

    this.setConditional = function (field, itemIndex, html) {
      field.items[itemIndex].conditional = {
        html: html.trim()
      }
    }
  }
}

module.exports = {
  schema,
  ViewModel
}

// // const schema2 = joi.object().keys({
// //   consent: joi.string().valid('yes', 'no').required(),
// //   mobile: joi.alternatives().conditional('consent', {
// //     is: 'yes',
// //     then: joi.string().required(),
// //     otherwise: joi.strip()
// //   })
// // }).required()

// const schema1 = joi.object().keys({
//   consent: joi.string().valid('yes', 'no').required(),
//   mobile: joi.string().trim().required().when('consent', { not: joi.valid('yes'), then: joi.allow('').strip() })
// }).required()

// const opts = { abortEarly: false }

// // console.log(schema1.validate({ mobile: '' }, opts))
// console.log(schema1.validate({ mobile: '' }, opts))
// console.log(schema1.validate({ consent: 'no', mobile: '' }, opts))
// console.log(schema1.validate({ consent: 'yes', mobile: '1234' }, opts))
// console.log(schema1.validate({ consent: 'no', mobile: '1234' }, opts))
// console.log(schema1.validate({ consent: 'yes', mobile: '' }, opts))
// console.log(schema1.validate({ consent: 'no', mobile: '' }, opts))
