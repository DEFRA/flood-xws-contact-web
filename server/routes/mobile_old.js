const { parsePhoneNumber, types } = require('flood-xws-common/util/phonenumber')
const config = require('../config')
const { Errors } = require('../models/form')
const { generateTOTP } = require('../lib/otp')
const { sendSMSToken } = require('../lib/phone-number')
const { ViewModel, schema, customErrors } = require('../models/mobile_old')

module.exports = [
  {
    method: 'GET',
    path: '/mobile',
    handler: (request, h) => {
      return h.view('mobile', new ViewModel())
    }
  },
  {
    method: 'POST',
    path: '/mobile',
    handler: async (request, h) => {
      const payload = request.payload
      const { mobile } = payload
      let type, e164

      try {
        // Parse number
        const parsed = parsePhoneNumber(mobile)
        ;({ type, e164 } = parsed)
      } catch (err) {
        request.log('error', err)
        return h.view('mobile', new ViewModel(payload, new Errors(customErrors.parseError)))
      }

      // Only allow MOBILE
      const isCorrectType = type === types.MOBILE

      if (!isCorrectType) {
        return h.view('mobile', new ViewModel(payload, new Errors(customErrors.incorrectFormat)))
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
    },
    options: {
      validate: {
        payload: schema,
        failAction: (request, h, err) => {
          return h.view('mobile', new ViewModel(request.payload, Errors.fromJoi(err))).takeover()
        }
      }
    }
  }
]
