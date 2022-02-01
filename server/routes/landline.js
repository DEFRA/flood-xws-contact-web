const { parsePhoneNumber, types } = require('flood-xws-common/util/phonenumber')
const config = require('../config')
const { Errors } = require('../models/form')
const { generateTOTP } = require('../lib/otp')
const { sendVoiceToken } = require('../lib/phone-number')
const { ViewModel, schema, customErrors } = require('../models/landline')

module.exports = [
  {
    method: 'GET',
    path: '/landline',
    handler: (request, h) => {
      return h.view('landline', new ViewModel())
    }
  },
  {
    method: 'POST',
    path: '/landline',
    handler: async (request, h) => {
      const payload = request.payload
      const { landline } = payload
      let type, e164

      try {
        // Parse number
        const parsed = parsePhoneNumber(landline)
        ;({ type, e164 } = parsed)
      } catch (err) {
        request.log('error', err)
        return h.view('landline', new ViewModel(payload, new Errors(customErrors.parseError)))
      }

      // Only allow FIXED_LINE
      const isCorrectType = type === types.FIXED_LINE

      if (!isCorrectType) {
        return h.view('landline', new ViewModel(payload, new Errors(customErrors.incorrectFormat)))
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
    },
    options: {
      validate: {
        payload: schema,
        failAction: (request, h, err) => {
          return h.view('landline', new ViewModel(request.payload, Errors.fromJoi(err))).takeover()
        }
      }
    }
  }
]
