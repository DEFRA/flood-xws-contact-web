const config = require('../config')
const { Errors } = require('../models/form')
const { ViewModel, schema, customErrors } = require('../models/verify-landline')
const { verifyTOTP } = require('../lib/otp')
const { updateContactLandline } = require('../lib/db')

module.exports = [
  {
    method: 'GET',
    path: '/verify-landline',
    handler: (request, h) => {
      const landlineState = request.yar.get('landline')
      const attemptsRemaining = landlineState?.attemptsRemaining

      if (!landlineState || !attemptsRemaining) {
        return h.redirect('/landline')
      }

      // Token can be stored in state in
      // certain environments to aid e2e testing
      const token = config.storeTokenInState && landlineState.token

      const { raw } = landlineState

      return h.view('verify-landline', new ViewModel({ raw, token }))
    }
  },
  {
    method: 'POST',
    path: '/verify-landline',
    handler: async (request, h) => {
      const landlineState = request.yar.get('landline')
      const attemptsRemaining = landlineState?.attemptsRemaining

      if (!landlineState || !attemptsRemaining) {
        return h.redirect('/landline')
      }

      const { payload } = request
      const { token } = payload
      const sessionId = request.yar.id
      const { value: landline, salt, raw } = landlineState

      const secret = `${sessionId}_${landline}_${salt}`
      const isValid = verifyTOTP(token, secret)

      if (!isValid) {
        --landlineState.attemptsRemaining

        if (!landlineState.attemptsRemaining) {
          request.yar.clear('landline')
          return h.redirect('/landline')
        }

        request.yar.set('landline', landlineState)

        if (landlineState.attemptsRemaining === 1) {
          const errors = new Errors(customErrors.lastAttempt)
          const model = new ViewModel({ ...payload, raw }, errors)

          return h.view('verify-landline', model).takeover()
        }

        const errors = new Errors(customErrors.incorrect)
        const model = new ViewModel({ ...payload, raw }, errors)

        return h.view('verify-landline', model).takeover()
      }

      request.yar.clear('landline')

      const credentials = request.auth.credentials

      // Update contact
      const contact = await updateContactLandline(credentials.contact.id, landline)

      request.cookieAuth.set({ contact })

      const next = contact.landline_active
        ? '/account'
        : '/consent-landline'

      return h.redirect(next)
    },
    options: {
      validate: {
        payload: schema,
        failAction: (request, h, err) => {
          const landlineState = request.yar.get('landline')

          if (!landlineState) {
            return h.redirect('/landline')
          }

          const { payload } = request
          const { raw } = landlineState
          const errors = Errors.fromJoi(err)

          return h.view('verify-landline', new ViewModel({ ...payload, raw }, errors)).takeover()
        }
      }
    }
  }
]
