const joi = require('joi')
const BaseModel = require('flood-xws-common/view/model')
const { getMappedErrors } = require('flood-xws-common/view/errors')
const config = require('../config')
const { verifyTOTP } = require('../lib/otp')
const { updateContactMobile } = require('../lib/db')

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

      return h.view('verify-mobile', new Model({ mobile: raw, token }))
    }
  },
  {
    method: 'POST',
    path: '/verify-mobile',
    handler: async (request, h) => {
      const mobileState = request.yar.get('mobile')
      const attemptsRemaining = mobileState?.attemptsRemaining

      if (!mobileState || !attemptsRemaining) {
        return h.redirect('/mobile')
      }

      const { payload } = request
      const { token } = payload
      const sessionId = request.yar.id
      const { value: mobile, salt } = mobileState

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
          const errors = { token: errorMessages.token.lastAttempt }
          const model = new Model({ ...payload, mobile }, errors)

          return h.view('verify-mobile', model).takeover()
        }

        const errors = { token: errorMessages.token.incorrect }
        const model = new Model({ ...payload, mobile }, errors)

        return h.view('verify-mobile', model).takeover()
      }

      request.yar.clear('mobile')

      const credentials = request.auth.credentials

      // Update contact
      const contact = await updateContactMobile(credentials.contact.id, mobile)

      request.cookieAuth.set({ contact })

      const next = contact.landline_active === null
        ? '/consent-landline'
        : '/account'

      return h.redirect(next)
    },
    options: {
      validate: {
        payload: joi.object().keys(schema),
        failAction: (request, h, err) => {
          const mobile = request.yar.get('mobile')

          if (!mobile) {
            return h.redirect('/mobile')
          }

          const { payload } = request
          const { raw } = mobile
          const errors = getMappedErrors(err, errorMessages)
          return h.view('verify-mobile', new Model({ ...payload, raw }, errors)).takeover()
        }
      }
    }
  }
]
