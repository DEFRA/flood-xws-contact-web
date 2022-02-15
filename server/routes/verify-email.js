const config = require('../config')
const { Errors } = require('../models/form')
const { ViewModel, schema, customErrors } = require('../models/verify-email')
const { verifyTOTP } = require('../lib/otp')
const { findLocation, insertLocation, findContact, insertContact, insertContactLocation } = require('../lib/db')

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

      return h.view('verify-email', new ViewModel({ raw, token }))
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
      const { value: email, raw, salt } = emailState

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
          const errors = new Errors(customErrors.lastAttempt)
          const model = new ViewModel({ ...payload, raw }, errors)

          return h.view('verify-email', model).takeover()
        }

        const errors = new Errors(customErrors.incorrect)
        const model = new ViewModel({ ...payload, raw }, errors)

        return h.view('verify-email', model).takeover()
      }

      request.yar.clear('email')

      // Insert/select contact
      // TODO (ds): transaction
      let contact = await findContact(email)

      if (!contact) {
        contact = await insertContact(email)
      }

      // Insert confirmed address from session (and remove)
      const address = request.yar.get('confirmed-address', true)

      request.yar.reset()

      if (address) {
        const { uprn: id, address: name, x, y } = address
        let locationRecord = await findLocation(id)

        if (!locationRecord) {
          locationRecord = await insertLocation(id, name, x, y)
        }

        await insertContactLocation(contact.id, locationRecord.id)
      }

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
        payload: schema,
        failAction: (request, h, err) => {
          const emailState = request.yar.get('email')

          if (!emailState) {
            return h.redirect('/email')
          }

          const { payload } = request
          const { raw } = emailState
          const errors = Errors.fromJoi(err)

          return h.view('verify-email', new ViewModel({ ...payload, raw }, errors)).takeover()
        }
      }
    }
  }
]
