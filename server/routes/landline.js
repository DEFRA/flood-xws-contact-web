const joi = require('joi')
const BaseModel = require('flood-xws-common/view/model')
const { getMappedErrors } = require('flood-xws-common/view/errors')
const { parsePhoneNumber, types } = require('flood-xws-common/util/phonenumber')
const config = require('../config')
const { generateTOTP } = require('../lib/otp')
const { sendVoiceToken } = require('../lib/phone-number')

const schema = {
  landline: joi.string().required()
}

const errorMessages = {
  landline: {
    incorrect: {
      summary: 'Enter a correct UK landline number',
      text: 'Enter a landline number in the correct format'
    },
    invalid: 'Invalid phone number',
    '*': {
      summary: 'Enter a landline number',
      text: 'Enter a landline number in the correct format'
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
    path: '/landline',
    handler: (request, h) => {
      return h.view('landline', new Model())
    }
  },
  {
    method: 'POST',
    path: '/landline',
    handler: async (request, h) => {
      const { landline } = request.payload

      try {
        // Parse number
        const parsed = parsePhoneNumber(landline)
        const { type, e164 } = parsed

        // Only allow FIXED_LINE
        const isCorrectType = type === types.FIXED_LINE

        if (!isCorrectType) {
          const errors = { landline: errorMessages.landline.incorrect }
          return h.view('landline', new Model(request.payload, errors))
        }

        // Send totp token
        const sessionId = request.yar.id
        const salt = Date.now()
        const token = generateTOTP(`${sessionId}_${e164}_${salt}`)

        await sendVoiceToken(e164, token)

        const landlineState = {
          salt,
          raw: landline,
          value: e164,
          attemptsRemaining: 3
        }

        // The token is stored in state to enable
        // e2e testing in certain environments
        const storeTokenInState = config.storeTokenInState

        if (storeTokenInState) {
          landlineState.token = token
        }

        request.yar.set('landline', landlineState)

        return h.redirect('/verify-landline')
      } catch (err) {
        request.log('error', err)
        const errors = { landline: errorMessages.landline.incorrect }
        return h.view('landline', new Model(request.payload, errors))
      }
    },
    options: {
      validate: {
        payload: joi.object().keys(schema),
        failAction: (request, h, err) => {
          const errors = getMappedErrors(err, errorMessages)
          return h.view('landline', new Model(request.payload, errors)).takeover()
        }
      }
    }
  }
]
