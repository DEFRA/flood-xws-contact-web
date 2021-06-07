require('dotenv').config()
const joi = require('joi')
const envs = ['local', 'sandbox', 'test', 'production']

const schema = joi.object().keys({
  env: joi.string().valid(...envs).required(),
  host: joi.string().hostname().required(),
  port: joi.number().required(),
  cookie: joi.object().keys({
    password: joi.string().min(32).required(),
    isSecure: joi.boolean().required()
  }).required(),
  os: joi.object().keys({
    placesKey: joi.string().required(),
    mapsKey: joi.string().required(),
    namesKey: joi.string().required()
  }).required(),
  verify: joi.object().keys({
    region: joi.string().required(),
    applicationId: joi.string().required()
  }).required(),
  rateLimit: joi.object().keys({
    enabled: joi.boolean().default(false),
    requests: joi.number().integer().when('rateLimitEnabled', { is: true, then: joi.required() }),
    expiresIn: joi.number().integer().when('rateLimitEnabled', { is: true, then: joi.required() }),
    whitelist: joi.array().items(joi.string().required()).default([])
  }).required(),
  redisCache: joi.object().keys({
    enabled: joi.boolean().default(false),
    host: joi.string().hostname().when('redisCacheEnabled', { is: true, then: joi.required() }),
    port: joi.number().integer().when('redisCacheEnabled', { is: true, then: joi.required() })
  }).required(),
  httpTimeoutMs: joi.number().required().min(0).max(30000),
  notify: joi.object().keys({
    apiKey: joi.string().required(),
    templates: joi.object().keys({
      smsToken: joi.string().required(),
      emailToken: joi.string().required()
    }).required()
  }).required(),
  twilio: joi.object().keys({
    accountId: joi.string().required(),
    authToken: joi.string().required(),
    fromPhoneNumber: joi.string().required()
  }).required(),
  phaseBannerTag: joi.string().required(),
  phaseBannerHtml: joi.string().required(),
  // Note: not a uri as it includes tokens for replacement
  subscriptionPatchUrl: joi.string().required(),
  subscriptionPostUrl: joi.string().required(),
  subscriptionGetUrl: joi.string().required(),
  subscriptionDeleteUrl: joi.string().required(),
  contactSubscriptionGetUrl: joi.string().required(),
  contactGetUrl: joi.string().required(),
  contactPostUrl: joi.string().required(),
  areaUrl: joi.string().uri().required()
})

const config = {
  env: process.env.ENV,
  host: process.env.HOST,
  port: process.env.PORT,
  phaseBannerTag: process.env.PHASE_BANNER_TAG,
  phaseBannerHtml: process.env.PHASE_BANNER_HTML,
  cookie: {
    password: process.env.COOKIE_PASSWORD,
    isSecure: process.env.COOKIE_IS_SECURE
  },
  os: {
    placesKey: process.env.OS_PLACES_KEY,
    mapsKey: process.env.OS_MAPS_KEY,
    namesKey: process.env.OS_NAMES_KEY
  },
  verify: {
    region: process.env.VERIFY_REGION,
    applicationId: process.env.VERIFY_APPLICATION_ID
  },
  rateLimit: {
    enabled: process.env.RATE_LIMIT_ENABLED,
    requests: process.env.RATE_LIMIT_REQUESTS,
    expiresIn: process.env.RATE_LIMIT_EXPIRES_IN,
    whitelist: process.env.RATE_LIMIT_WHITELIST.split(',')
  },
  redisCache: {
    enabled: process.env.REDIS_CACHE_ENABLED
  },
  httpTimeoutMs: process.env.HTTP_TIMEOUT_MS,
  notify: {
    apiKey: process.env.NOTIFY_API_KEY,
    templates: {
      smsToken: process.env.NOTIFY_TEMPLATE_SMS_TOKEN,
      emailToken: process.env.NOTIFY_TEMPLATE_EMAIL_TOKEN
    }
  },
  twilio: {
    accountId: process.env.TWILIO_ACCOUNT_ID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromPhoneNumber: process.env.TWILIO_FROM_PHONE_NUMBER
  },
  contactGetUrl: process.env.CONTACT_GET_URL,
  contactPostUrl: process.env.CONTACT_POST_URL,
  contactSubscriptionGetUrl: process.env.CONTACT_SUBSCRIPTION_GET_URL,
  subscriptionGetUrl: process.env.SUBSCRIPTION_GET_URL,
  subscriptionPostUrl: process.env.SUBSCRIPTION_POST_URL,
  subscriptionPatchUrl: process.env.SUBSCRIPTION_PATCH_URL,
  subscriptionDeleteUrl: process.env.SUBSCRIPTION_DELETE_URL,
  areaUrl: process.env.AREA_URL
}

const { error, value } = schema.validate(config)

if (error) {
  throw new Error(`The server config is invalid. ${error.message}`)
}

value.isLocal = value.env === 'local'

module.exports = value
