const joi = require('joi')
const BaseModel = require('flood-xws-common/view/model')
const { getMappedErrors } = require('flood-xws-common/view/errors')
const config = require('../config')
const { verifyTOTP } = require('../lib/otp')
const { updateContactLandline } = require('../lib/db')

const errorMessages = {
  token: {
    'string.empty': 'Enter a valid code',
    'string.length': 'Enter a valid 6 digit code',
    incorrect: 'The code you entered is incorrect',
    lastAttempt: 'The code you entered is incorrect - you have 1 attempt remaining'
  }
}

const schema = {
  token: joi.string().length(6).required()
}

class Model extends BaseModel {
  constructor (data, err) {
    super(data, err, errorMessages)
  }
}

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

      return h.view('verify-landline', new Model({ raw, token }))
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
      const { value: landline, salt } = landlineState

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
          const errors = { token: errorMessages.token.lastAttempt }
          const model = new Model({ ...payload, landline }, errors)

          return h.view('verify-landline', model).takeover()
        }

        const errors = { token: errorMessages.token.incorrect }
        const model = new Model({ ...payload, landline }, errors)

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
        payload: joi.object().keys(schema),
        failAction: (request, h, err) => {
          const landline = request.yar.get('landline')

          if (!landline) {
            return h.redirect('/landline')
          }

          const { payload } = request
          const { raw } = landline
          const errors = getMappedErrors(err, errorMessages)
          return h.view('verify-landline', new Model({ ...payload, raw }, errors)).takeover()
        }
      }
    }
  }
]
