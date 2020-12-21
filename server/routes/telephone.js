const joi = require('joi')
const BaseModel = require('xws-shared/view/model')
const { getMappedErrors } = require('xws-shared/view/errors')
const { parsePhoneNumber, types } = require('xws-shared/util/phonenumber')
const config = require('../config')
const { generateTOTP } = require('../lib/otp')
const { sendSMSToken, sendVoiceToken } = require('../lib/phone-number')

const schema = {
  telephone: joi.string().required()
}

const errorMessages = {
  telephone: {
    incorrect: {
      summary: 'Enter a correct UK telephone number',
      text: 'Enter a telephone number in the correct format'
    },
    invalid: 'Invalid phone number',
    '*': {
      summary: 'Enter a telephone number',
      text: 'Enter a telephone number in the correct format'
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
    path: '/telephone',
    handler: (request, h) => {
      return h.view('telephone', new Model())
    },
    options: {
      auth: {
        mode: 'try'
      }
    }
  },
  {
    method: 'POST',
    path: '/telephone',
    handler: async (request, h) => {
      const { telephone } = request.payload

      try {
        // Parse number
        const parsed = parsePhoneNumber(telephone)
        const { type, e164 } = parsed

        // Only allow FIXED_LINE, MOBILE and VOIP
        const isCorrectType = type === types.FIXED_LINE || type === types.MOBILE || type === types.VOIP

        if (!isCorrectType) {
          const errors = { telephone: errorMessages.telephone.incorrect }
          return h.view('telephone', new Model(request.payload, errors))
        }

        // Send totp token
        const sessionId = request.yar.id
        const salt = Date.now()
        const token = generateTOTP(`${sessionId}_${e164}_${salt}`)

        let kind, deliveryMethod, sendResult
        if (type === types.FIXED_LINE || type === types.VOIP) {
          kind = 'landline'
          deliveryMethod = 'voice'
          sendResult = await sendVoiceToken(e164, token)
        } else {
          kind = 'mobile'
          deliveryMethod = 'SMS'
          sendResult = await sendSMSToken(e164, token)
        }

        const state = {
          salt,
          attemptsRemaining: 3,
          contact: {
            kind,
            value: e164,
            raw: telephone,
            deliveryMethod,
            sendResult: {
              status: sendResult.statusText,
              uri: sendResult.data.uri
            }
          }
        }

        // The token is stored in state to enable
        // e2e testing in certain environments
        const storeTokenInState = config.isLocal

        if (storeTokenInState) {
          state.token = token
        }

        request.yar.set(state)

        return h.redirect('/verify')
      } catch (err) {
        request.log('error', err)
        const errors = { telephone: errorMessages.telephone.incorrect }
        return h.view('telephone', new Model(request.payload, errors))
      }
    },
    options: {
      auth: {
        mode: 'try'
      },
      validate: {
        payload: joi.object().keys(schema),
        failAction: (request, h, err) => {
          const errors = getMappedErrors(err, errorMessages)
          return h.view('telephone', new Model(request.payload, errors)).takeover()
        }
      }
    }
  }
]
