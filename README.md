[![CI](https://github.com/NeXt-Warning-System/contact-web/workflows/CI/badge.svg)](https://travis-ci.org/DEFRA/hapi-web-boilerplate) [![Maintainability](https://api.codeclimate.com/v1/badges/5c3956c73c9b1496dadd/maintainability)](https://codeclimate.com/github/DEFRA/hapi-web-boilerplate/maintainability) [![Test Coverage](https://api.codeclimate.com/v1/badges/5c3956c73c9b1496dadd/test_coverage)](https://codeclimate.com/github/DEFRA/hapi-web-boilerplate/test_coverage) [![Greenkeeper badge](https://badges.greenkeeper.io/DEFRA/hapi-web-boilerplate.svg)](https://greenkeeper.io/)

# xws-contact-web
Public facing "Get flood warnings" registration website

# Environment variables

| name     | description      | required | default |            valid            | notes |
|----------|------------------|:--------:|---------|:---------------------------:|-------|
| NODE_ENV | Node environment |    no    |         | dev,test,prod               |       |
| PORT     | Port number      |    no    | 3000    |                             |       |

# Prerequisites

Node v12+

# Running the application

First install the dependencies and build the application using:

`$ npm i`

`$ npm run build`

Currently this will just build the `govuk-frontend` sass but may be extended to include other build tasks as needed (e.g. client-side js using browserify or webpack etc.)

Now the application is ready to run:

`$ node index.js`

Check the server is running by pointing your browser to `http://localhost:3000`

## What is this?

Based on:

- [hapijs](https://github.com/hapijs/hapi) - The framework & core plugins like `joi`, `vision` etc.
- [standardjs](http://standardjs.com/) - Linting
- [govuk-frontend](https://github.com/alphagov/govuk-frontend) - Styles & macros
- [nunjucks](http://mozilla.github.io/nunjucks/) - Default template engine
- [npm-scripts](https://docs.npmjs.com/misc/scripts) - Build tool
- [pm2](https://github.com/Unitech/pm2) - Process manager

## Getting started

Clone this repo and run through the steps above.

## Project structure

Here's the default structure for your project files.

* **bin** (build tasks)
* **client** (client js/sass code)
* **server**
  * **plugins**
  * **public**  (This folder is publicly served)
    * **static** (Put all static assets in here)
    * **build** (This contains the build output files (js/css etc.) and is not checked-in)
  * **routes**
  * **views**
  * config.js
  * index.js (Exports a function that creates a server)
* **test**
* README.md
* LICENCE
* index.js (startup server)

## Config

The configuration file for the server is found at `server/config.js`.
This is where to put any config and all config should be read from the environment.
The final config object should be validated using joi and the application should not start otherwise.

A table of environment variables should be maintained in this README.

## Plugins

hapi has a powerful plugin system and all server code should be loaded in a plugin.

Plugins live in the `server/plugins` directory.

## Logging

The [hapi-pino](https://github.com/pinojs/hapi-pino) plugin is used and configured in `server/plugins/logging`

## Routes

Incoming requests are handled by the server via routes. 
Each route describes an HTTP endpoint with a path, method, and other properties.

Routes are found in the `server/routes` directory and loaded using the `server/plugins/router.js` plugin.

Hapi supports registering routes individually or in a batch.
Each route file can therefore export a single route object or an array of route objects.

A single route looks like this:

```js
{
  method: 'GET',
  path: '/hello-world',
  options: {
    handler: (request, h) => {
      return 'hello world'
    }
  }
}
```

There are lots of [route options](http://hapijs.com/api#route-options), here's the documentation on [hapi routes](http://hapijs.com/tutorials/routing)

## Tasks

Build tasks are created using simple shell scripts or node.js programs.
The default ones are found in the `bin` directory.

The task runner is simply `npm` using `npm-scripts`.

We chose to use this for simplicity but there's nothing to stop you adding `gulp`, `grunt` or another task runner if you prefer. 

The predefined tasks are:

- `npm run build` (Runs all build sub-tasks)
- `npm run build:css` (Builds the client-side sass)
- `npm run lint` (Runs the lint task using standard.js)
- `npm run unit-test` (Runs the `lab` tests in the `/test` folder)
- `npm test` (Runs the `lint` task then the `unit-tests`)

### Resources

For more information around using `npm-scripts` as a build tool:

- http://substack.net/task_automation_with_npm_run
- http://ponyfoo.com/articles/choose-grunt-gulp-or-npm
- http://blog.keithcirkel.co.uk/why-we-should-stop-using-grunt/
- http://blog.keithcirkel.co.uk/how-to-use-npm-as-a-build-tool/

## Testing

[lab](https://github.com/hapijs/lab) and [code](https://github.com/hapijs/code) are used for unit testing.

See the `/test` folder for more information.

## Deploying
The first time you deploy to a PaaS space it will fail because it doesn't have the APP_CONFIG envar. To fix it, run one of these:

`cf set-env xws-contact-web-sandbox APP_CONFIG sandbox`
`cf set-env xws-contact-web-test APP_CONFIG test`
`cf set-env xws-contact-web-production APP_CONFIG production`

then one of

`cf restage xws-contact-web-sandbox`
`cf restage xws-contact-web-test`
`cf restage xws-contact-web-production`

## Linting

[standard.js](http://standardjs.com/) is used to lint both the server-side and client-side javascript code.

It's defined as a build task and can be run using `npm run lint`.

## License

THIS INFORMATION IS LICENSED UNDER THE CONDITIONS OF THE OPEN GOVERNMENT LICENCE found at:

http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3

The following attribution statement MUST be cited in your products and applications when using this information.

> Contains public sector information licensed under the Open Government license v3

### About the license

The Open Government Licence (OGL) was developed by the Controller of Her Majesty's Stationery Office (HMSO) to enable information providers in the public sector to license the use and re-use of their information under a common open licence.

It is designed to encourage use and re-use of information freely and flexibly, with only a few conditions.
