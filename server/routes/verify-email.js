const config = require('../config')
const { Errors } = require('../models/form')
const { ViewModel, schema, customErrors } = require('../models/verify-email')
const { verifyTOTP } = require('../lib/otp')
const { updateContact, insertContactLocation } = require('../lib/db')

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
      // let contact = await findContact(email)

      // if (!contact) {
      //   contact = await insertContact(email)
      // }

      const contact = await updateContact(email, {
        email,
        last_logged_in: Date.now()
      })

      // Set sign in cookie
      request.cookieAuth.set({ id: email })

      // If one exists, insert confirmed address from session
      const address = request.yar.get('confirmed-address', true)

      request.yar.reset()

      if (address) {
        await insertContactLocation(contact.id, address.uprn, address)
      }

      const next = 'email_active' in contact
        ? '/account'
        : '/consent-email'

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
