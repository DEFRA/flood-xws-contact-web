require('dotenv').config()
const joi = require('joi')
const envs = ['sandbox', 'development', 'test', 'production']

const schema = joi.object().keys({
  env: joi.string().valid(...envs).required(),
  host: joi.string().hostname().required(),
  port: joi.number().required(),
  databaseUrl: joi.string().required(),
  databaseSsl: joi.boolean().required(),
  cookie: joi.object().keys({
    password: joi.string().min(32).required(),
    isSecure: joi.boolean().required()
  }).required(),
  osApi: joi.object().keys({
    key: joi.string().required(),
    url: joi.string().uri().required()
  }).required(),
  httpTimeoutMs: joi.number().min(0).max(30000).required(),
  pinpointApplicationId: joi.string().required(),
  pinpointFromAddress: joi.string().required(),
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
  logLevel: joi.string().valid('debug', 'warn').required(),
  cacheViews: joi.boolean().default(true).required(),
  storeTokenInState: joi.boolean().default(false).required()
})

const config = {
  env: process.env.ENV,
  host: process.env.HOST,
  port: process.env.PORT,
  databaseUrl: process.env.DATABASE_URL,
  databaseSsl: process.env.DATABASE_SSL || false,
  phaseBannerTag: process.env.PHASE_BANNER_TAG,
  phaseBannerHtml: process.env.PHASE_BANNER_HTML,
  cookie: {
    password: process.env.COOKIE_PASSWORD,
    isSecure: process.env.COOKIE_IS_SECURE
  },
  osApi: {
    url: process.env.OS_API_URL,
    key: process.env.OS_API_KEY
  },
  httpTimeoutMs: process.env.HTTP_TIMEOUT_MS,
  pinpointApplicationId: process.env.PINPOINT_APPLICATION_ID,
  pinpointFromAddress: process.env.PINPOINT_FROM_ADDRESS,
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
  logLevel: process.env.LOG_LEVEL || 'debug',
  cacheViews: process.env.CACHE_VIEWS || true,
  storeTokenInState: process.env.STORE_TOKEN_IN_STATE || false
}

const { error, value } = schema.validate(config)

if (error) {
  throw new Error(`The server config is invalid. ${error.message}`)
}

value.serviceName = 'Get flood warnings'
value.defaultPageTitle = `${value.serviceName} - GOV.UK`

module.exports = value
