const config = require('../config')
const { Errors } = require('../models/form')
const { ViewModel, schema, customErrors } = require('../models/verify-email')
const { verifyTOTP } = require('../lib/otp')
const { findLocation, insertLocation, findContact, insertContact, updateContactReceiveMessages, insertContactLocation } = require('../lib/db')

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
        payload: schema,
        failAction: (request, h, err) => {
          const email = request.yar.get('email')

          if (!email) {
            return h.redirect('/email')
          }

          const { payload } = request
          const { raw } = email

          return h.view('verify-email', new ViewModel({ ...payload, raw }, Errors.fromJoi(err))).takeover()
        }
      }
    }
  }
]
