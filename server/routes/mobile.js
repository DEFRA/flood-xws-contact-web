const { parsePhoneNumber, types } = require('flood-xws-common/util/phonenumber')
const config = require('../config')
const { Errors } = require('../models/form')
const { generateTOTP } = require('../lib/otp')
const { sendSMSToken } = require('../lib/phone-number')
const { ViewModel, schema, customErrors } = require('../models/mobile')
const { updateContactMobileActive, updateContactMobile, getContactById } = require('../lib/db')

module.exports = [
  {
    method: 'GET',
    path: '/mobile',
    handler: async (request, h) => {
      const { id } = request.auth.credentials
      const contact = await getContactById(id)
      const { mobile_active: consent, mobile } = contact

      return h.view('mobile', new ViewModel({ consent, mobile }))
    }
  },
  {
    method: 'POST',
    path: '/mobile',
    handler: async (request, h) => {
      const { id } = request.auth.credentials
      const payload = request.payload
      const { consent, mobile } = payload

      if (!consent) {
        // Update contact - clear mobile consent and number
        await updateContactMobileActive(id, false)
        await updateContactMobile(id, null)

        return h.redirect('/account')
      } else {
        // Parse number and send verify code
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
      }
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
