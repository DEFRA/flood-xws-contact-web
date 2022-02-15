const config = require('../config')
const { Errors } = require('../models/form')
const { ViewModel, schema, customErrors } = require('../models/verify-mobile')
const { verifyTOTP } = require('../lib/otp')
const { updateContactMobileActive, updateContactMobile } = require('../lib/db')

module.exports = [
  {
    method: 'GET',
    path: '/verify-mobile',
    handler: (request, h) => {
      const mobileState = request.yar.get('mobile')
      const attemptsRemaining = mobileState?.attemptsRemaining

      if (!mobileState || !attemptsRemaining) {
        return h.redirect('/mobile')
      }

      // Token can be stored in state in
      // certain environments to aid e2e testing
      const token = config.storeTokenInState && mobileState.token

      const { raw } = mobileState

      return h.view('verify-mobile', new ViewModel({ raw, token }))
    }
  },
  {
    method: 'POST',
    path: '/verify-mobile',
    handler: async (request, h) => {
      const mobileState = request.yar.get('mobile')
      const attemptsRemaining = mobileState?.attemptsRemaining

      if (!mobileState || !attemptsRemaining) {
        return h.redirect('/mob')
      }

      const { payload } = request
      const { token } = payload
      const sessionId = request.yar.id
      const { value: mobile, salt, raw } = mobileState

      const secret = `${sessionId}_${mobile}_${salt}`
      const isValid = verifyTOTP(token, secret)

      if (!isValid) {
        --mobileState.attemptsRemaining

        if (!mobileState.attemptsRemaining) {
          request.yar.clear('mobile')
          return h.redirect('/mobile')
        }

        request.yar.set('mobile', mobileState)

        if (mobileState.attemptsRemaining === 1) {
          const errors = new Errors(customErrors.lastAttempt)
          const model = new ViewModel({ ...payload, raw }, errors)

          return h.view('verify-mobile', model).takeover()
        }

        const errors = new Errors(customErrors.incorrect)
        const model = new ViewModel({ ...payload, raw }, errors)

        return h.view('verify-mobile', model).takeover()
      }

      request.yar.clear('mobile')

      const auth = request.auth
      const { id } = auth.credentials

      // Update contact
      await updateContactMobileActive(id, true)
      await updateContactMobile(id, mobile)

      const next = '/account'

      return h.redirect(next)
    },
    options: {
      validate: {
        payload: schema,
        failAction: (request, h, err) => {
          const mobileState = request.yar.get('mobile')

          if (!mobileState) {
            return h.redirect('/mobile')
          }

          const { payload } = request
          const { raw } = mobileState
          const errors = Errors.fromJoi(err)

          return h.view('verify-mobile', new ViewModel({ ...payload, raw }, errors)).takeover()
        }
      }
    }
  }
]
