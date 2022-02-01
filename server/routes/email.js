const config = require('../config')
const { generateTOTP } = require('../lib/otp')
const { sendEmailToken } = require('../lib/email')
const { ViewModel, schema } = require('../models/email')
const { Errors } = require('../models/form')

module.exports = [
  {
    method: 'GET',
    path: '/email',
    handler: (request, h) => {
      return h.view('email', new ViewModel())
    },
    options: {
      auth: {
        mode: 'try'
      }
    }
  },
  {
    method: 'POST',
    path: '/email',
    handler: async (request, h) => {
      const { email } = request.payload
      const sessionId = request.yar.id

      // Send totp token
      const salt = Date.now()
      const secret = `${sessionId}_${email}_${salt}`
      const token = generateTOTP(secret)
      await sendEmailToken(email, token)

      const emailState = {
        salt,
        raw: email,
        value: email,
        attemptsRemaining: 3
      }

      // The token is stored in state to enable
      // e2e testing in certain environments
      const storeTokenInState = config.storeTokenInState

      if (storeTokenInState) {
        emailState.token = token
      }

      request.yar.set('email', emailState)

      return h.redirect('/verify-email')
    },
    options: {
      auth: {
        mode: 'try'
      },
      validate: {
        payload: schema,
        failAction: (request, h, err) => {
          return h.view('email', new ViewModel(request.payload, Errors.fromJoi(err))).takeover()
        }
      }
    }
  }
]
