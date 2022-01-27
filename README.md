# xws-contact-web
Public facing "Get flood warnings" registration website

# Environment variables

| name     | description      | required | default |            valid            | notes |
|----------|------------------|:--------:|---------|:---------------------------:|-------|
| NODE_ENV | Node environment |    no    |         | sandbox,test,production     |       |
| PORT     | Port number      |    no    |         |                             |       |

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

The first time you deploy to a PaaS space it will fail because it doesn't have the APP_CONFIG envar. To fix it, run one of these:

`cf set-env xws-contact-web-sandbox APP_CONFIG sandbox`
`cf set-env xws-contact-web-test APP_CONFIG test`
`cf set-env xws-contact-web-production APP_CONFIG production`

then one of

`cf restage xws-contact-web-sandbox`
`cf restage xws-contact-web-test`
`cf restage xws-contact-web-production`

## License

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3

The following attribution statement MUST be cited in your products and applications when using this information.

> Contains public sector information licensed under the Open Government license v3

### About the license

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable information providers in the public sector to license the use and re-use of their information under a common open licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.
