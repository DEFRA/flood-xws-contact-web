# flood-xws-contact-web

Public facing "Get flood warnings" registration website

# Environment variables

| name                         | description                    | required   | valid                         |
| :--------------------------  | :----------------------------  | :--------: | :---------------------------: |
| ENV                          | Deployment environment         | yes        | sandbox,test,production       |
| HOST                         | Hostname                       | yes        |                               |
| PORT                         | Port number                    | yes        |                               |
| AREA_API_URL                 | Area API URL                   | yes        |                               |
| CONTACT_TABLE_NAME           | DynamoDB contact table         | yes        |                               |
| SUBSCRIPTION_TABLE_NAME      | DynamoDB subscription table    | yes        |                               |
| COOKIE_PASSWORD              |                                | yes        |                               |
| COOKIE_IS_SECURE             |                                | yes        |                               |
| HTTP_TIMEOUT_MS              |                                | yes        |                               |
| PHASE_BANNER_TAG             | Phase banner tag               | yes        |                               |
| PHASE_BANNER_HTML            | Phase banner tag html          | yes        |                               |
| OS_API_URL                   | Ordnance survey api URL        | yes        |                               |
| OS_API_KEY                   | Ordnance survey api key        | yes        |                               |
| NOTIFY_API_KEY               | GOV.UK Notify Api Key          | yes        |                               |
| NOTIFY_TEMPLATE_SMS_TOKEN    | GOV.UK Notify SMS Token        | yes        |                               |
| NOTIFY_TEMPLATE_EMAIL_TOKEN  | GOV.UK Notify Email Token      | yes        |                               |
| TWILIO_ACCOUNT_ID            | Twilio account id              | yes        |                               |
| TWILIO_AUTH_TOKEN            | Twilio auth token              | yes        |                               |
| TWILIO_FROM_PHONE_NUMBER     | Twilio sender number           | yes        |                               |
| CACHE_VIEWS                  | Cache view flag                | yes        | true/false                    |
| LOG_LEVEL                    | Logging level                  | no         | "debug" (default) or "warn"   |
| STORE_TOKEN_IN_STATE         | Testing flag to prefill OTP    | no         | true/false  (default)         |


As per [12 Factor principles](https://12factor.net/config) application config is stored in environment variables (env vars). For ease of local development the service should have a `.env` file in its root folder. Starter `.env` files for local development for this service are held in the [xws config repo](https://github.com/DEFRA/flood-xws-config/tree/master/flood-xws-contact-web) repository.

# Prerequisites

* [Node v14+](https://nodejs.org/en/download/)

# Running the application

First install the dependencies and build the application using:

`$ npm i`

`$ npm run build`

Now the application is ready to run:

`$ node index.js`

Check the server is running by pointing your browser to `http://localhost:3001`

## Deploying (GOV.UK PaaS)

`npm run deploy`

And follow the instructions in the config repo on how to set environment vaiables in GOV.UK PaaS (CloudFoundry)

## License

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3

The following attribution statement MUST be cited in your products and applications when using this information.

> Contains public sector information licensed under the Open Government license v3

### About the license

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable information providers in the public sector to license the use and re-use of their information under a common open licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.