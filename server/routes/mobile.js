const joi = require('joi')
const BaseModel = require('flood-xws-common/view/model')
const { getMappedErrors } = require('flood-xws-common/view/errors')
const { parsePhoneNumber, types } = require('flood-xws-common/util/phonenumber')
const config = require('../config')
const { generateTOTP } = require('../lib/otp')
const { sendSMSToken } = require('../lib/phone-number')

const schema = {
  mobile: joi.string().required()
}

const errorMessages = {
  mobile: {
    incorrect: {
      summary: 'Enter a correct UK mobile number',
      text: 'Enter a mobile number in the correct format'
    },
    invalid: 'Invalid phone number',
    '*': {
      summary: 'Enter a mobile number',
      text: 'Enter a mobile number in the correct format'
    }
  }
}

class Model extends BaseModel {
  constructor (data, err) {
    super(data, err, errorMessages)
  }
}

module.exports = [
  {
    method: 'GET',
    path: '/mobile',
    handler: (request, h) => {
      return h.view('mobile', new Model())
    }
  },
  {
    method: 'POST',
    path: '/mobile',
    handler: async (request, h) => {
      const { mobile } = request.payload

      try {
        // Parse number
        const parsed = parsePhoneNumber(mobile)
        const { type, e164 } = parsed

        // Only allow MOBILE
        const isCorrectType = type === types.MOBILE

        if (!isCorrectType) {
          const errors = { mobile: errorMessages.mobile.incorrect }
          return h.view('mobile', new Model(request.payload, errors))
        }

        // Send totp token
        const sessionId = request.yar.id
        const salt = Date.now()
        const token = generateTOTP(`${sessionId}_${e164}_${salt}`)

        await sendSMSToken(e164, token)

        const mobileState = {
          salt,
          raw: mobile,
          value: e164,
          attemptsRemaining: 3
        }

        // The token is stored in state to enable
        // e2e testing in certain environments
        const storeTokenInState = config.storeTokenInState

        if (storeTokenInState) {
          mobileState.token = token
        }

        request.yar.set('mobile', mobileState)

        return h.redirect('/verify-mobile')
      } catch (err) {
        request.log('error', err)
        const errors = { mobile: errorMessages.mobile.incorrect }
        return h.view('mobile', new Model(request.payload, errors))
      }
    },
    options: {
      validate: {
        payload: joi.object().keys(schema),
        failAction: (request, h, err) => {
          const errors = getMappedErrors(err, errorMessages)
          return h.view('mobile', new Model(request.payload, errors)).takeover()
        }
      }
    }
  }
]
