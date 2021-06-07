const joi = require('joi')
const BaseModel = require('xws-shared/view/model')
const { getMappedErrors } = require('xws-shared/view/errors')
const config = require('../config')
const { verifyTOTP } = require('../lib/otp')
const { getContact: findContact, postContact: insertContact } = require('../lib/api')

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
    path: '/verify',
    handler: (request, h) => {
      const salt = request.yar.get('salt')
      const contact = request.yar.get('contact')
      const attemptsRemaining = request.yar.get('attemptsRemaining')

      if (!contact || !salt || !attemptsRemaining) {
        return h.redirect('/contact-type')
      }

      // Token can be stored in state in
      // certain environments to aid e2e testing
      const token = config.isLocal && request.yar.get('token')

      const { raw, deliveryMethod } = contact
      return h.view('verify', new Model({ raw, deliveryMethod, token }))
    },
    options: {
      auth: {
        mode: 'try'
      }
    }
  },
  {
    method: 'POST',
    path: '/verify',
    handler: async (request, h) => {
      const salt = request.yar.get('salt')
      const contact = request.yar.get('contact')
      let attemptsRemaining = request.yar.get('attemptsRemaining')

      if (!contact || !salt || !attemptsRemaining) {
        return h.redirect('/contact-type')
      }

      const { payload } = request
      const { token } = payload
      const sessionId = request.yar.id
      const { value, raw, kind, deliveryMethod } = contact

      const isValid = verifyTOTP(token, `${sessionId}_${value}_${salt}`)

      if (!isValid) {
        --attemptsRemaining
        request.yar.set('attemptsRemaining', attemptsRemaining)

        if (!attemptsRemaining) {
          return h.redirect('/contact-type')
        }

        if (attemptsRemaining === 1) {
          const errors = { token: errorMessages.token.lastAttempt }
          const model = new Model({ ...payload, raw, deliveryMethod }, errors)
          return h.view('verify', model).takeover()
        }

        const errors = { token: errorMessages.token.incorrect }
        const model = new Model({ ...payload, raw, deliveryMethod }, errors)
        return h.view('verify', model).takeover()
      }

      // Insert/select contact
      // TODO (ds): transaction
      let existingUser = true
      let contactItem = await findContact(value)

      if (!contactItem) {
        contactItem = await insertContact(value, kind)
        existingUser = false
      }

      request.yar.clear('salt')
      request.yar.clear('attemptsRemaining')

      request.cookieAuth.set({
        contactId: contactItem.id,
        contactKind: contactItem.contactKindName,
        contact: value,
        sessionId
      })

      const next = existingUser
        ? '/contact'
        : '/find-location'

      return h.redirect(next)
    },
    options: {
      auth: {
        mode: 'try'
      },
      validate: {
        payload: joi.object().keys(schema),
        failAction: (request, h, err) => {
          const contact = request.yar.get('contact')

          if (!contact) {
            return h.redirect('/contact-type')
          }

          const { payload } = request
          const { raw, deliveryMethod } = contact
          const errors = getMappedErrors(err, errorMessages)
          return h.view('verify', new Model({ ...payload, raw, deliveryMethod }, errors)).takeover()
        }
      }
    }
  }
]
