const joi = require('joi')
const BaseModel = require('flood-xws-common/view/model')
const { getMappedErrors } = require('flood-xws-common/view/errors')
const config = require('../config')
const { generateTOTP } = require('../lib/otp')
const { sendEmailToken } = require('../lib/email')

const errorMessages = {
  email: 'Enter a valid email address'
}

const schema = {
  email: joi.string().email().required()
}

class Model extends BaseModel {
  constructor (data, err) {
    super(data, err, errorMessages)
  }
}

module.exports = [
  {
    method: 'GET',
    path: '/email',
    handler: (request, h) => {
      return h.view('email', new Model())
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

      try {
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
      } catch (err) {
        request.log('error', err)
        const errors = { email: errorMessages.email.incorrect }
        return h.view('email', new Model(request.payload, errors))
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
          return h.view('email', new Model(request.payload, errors)).takeover()
        }
      }
    }
  }
]
