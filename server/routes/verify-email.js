const joi = require('joi')
const BaseModel = require('flood-xws-common/view/model')
const { getMappedErrors } = require('flood-xws-common/view/errors')
const config = require('../config')
const { verifyTOTP } = require('../lib/otp')
const { findLocation, insertLocation, findContact, insertContact, updateContactReceiveMessages, insertContactLocation } = require('../lib/db')

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
    path: '/verify-email',
    handler: (request, h) => {
      const emailState = request.yar.get('email')
      const attemptsRemaining = emailState?.attemptsRemaining

      if (!emailState || !attemptsRemaining) {
        return h.redirect('/email')
      }

      // Token can be stored in state in
      // certain environments to aid e2e testing
      const token = config.storeTokenInState && emailState.token

      const { raw } = emailState

      return h.view('verify-email', new Model({ raw, token }))
    },
    options: {
      auth: {
        mode: 'try'
      }
    }
  },
  {
    method: 'POST',
    path: '/verify-email',
    handler: async (request, h) => {
      const emailState = request.yar.get('email')
      const attemptsRemaining = emailState?.attemptsRemaining

      if (!emailState || !attemptsRemaining) {
        return h.redirect('/email')
      }

      const { payload } = request
      const { token } = payload
      const sessionId = request.yar.id
      const { value: email, salt } = emailState

      const secret = `${sessionId}_${email}_${salt}`
      const isValid = verifyTOTP(token, secret)

      if (!isValid) {
        --emailState.attemptsRemaining

        if (!emailState.attemptsRemaining) {
          request.yar.clear('email')
          return h.redirect('/email')
        }

        request.yar.set('email', emailState)

        if (emailState.attemptsRemaining === 1) {
          const errors = { token: errorMessages.token.lastAttempt }
          const model = new Model({ ...payload, email }, errors)

          return h.view('verify-email', model).takeover()
        }

        const errors = { token: errorMessages.token.incorrect }
        const model = new Model({ ...payload, email }, errors)

        return h.view('verify-email', model).takeover()
      }

      request.yar.clear('email')

      // Insert/select contact
      // TODO (ds): transaction
      let contact = await findContact(email)

      if (!contact) {
        contact = await insertContact(email)

        // Insert locations and severity from session (and remove)
        const severity = request.yar.get('severity', true)
        const locations = request.yar.get('locations', true)
        request.yar.clear()

        if (severity) {
          contact = await updateContactReceiveMessages(contact.id, severity)
        }

        if (Array.isArray(locations)) {
          for await (const location of locations) {
            const ref = location.id
            let locationRecord = await findLocation(ref)

            if (!locationRecord) {
              const { name, x, y, xmin, ymin, xmax, ymax } = location

              locationRecord = await insertLocation(ref, name, x, y, xmin, ymin, xmax, ymax)
            }

            await insertContactLocation(contact.id, locationRecord.id)
          }
        }
      }

      request.cookieAuth.set({ contact })

      const next = contact.email_active === null
        ? '/consent-email'
        : '/account'

      return h.redirect(next)
    },
    options: {
      auth: {
        mode: 'try'
      },
      validate: {
        payload: joi.object().keys(schema),
        failAction: (request, h, err) => {
          const email = request.yar.get('email')

          if (!email) {
            return h.redirect('/email')
          }

          const { payload } = request
          const { raw } = email
          const errors = getMappedErrors(err, errorMessages)
          return h.view('verify-email', new Model({ ...payload, raw }, errors)).takeover()
        }
      }
    }
  }
]
