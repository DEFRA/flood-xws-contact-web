const path = require('path')
const nunjucks = require('nunjucks')
const { markSafe } = require('nunjucks/src/runtime')
const config = require('../config')
const pkg = require('../../package.json')
const { encrypt } = require('../lib/crtpy')
const analyticsAccount = config.analyticsAccount

module.exports = {
  plugin: require('@hapi/vision'),
  options: {
    engines: {
      html: {
        compile: (src, options) => {
          const template = nunjucks.compile(src, options.environment)

          return (context) => {
            return template.render(context)
          }
        },
        prepare: (options, next) => {
          const env = options.compileOptions.environment = nunjucks.configure([
            path.join(options.relativeTo || process.cwd(), options.path),
            'node_modules/govuk-frontend/'
          ], {
            autoescape: true,
            watch: false
          })

          // Register globals/filters
          env.addGlobal('encrypt', markSafe(encrypt))

          return next()
        }
      }
    },
    path: '../views',
    relativeTo: __dirname,
    isCached: config.cacheViews,
    context: {
      appVersion: pkg.version,
      assetPath: '/assets',
      serviceName: config.serviceName,
      pageTitle: config.defaultPageTitle,
      defaultPageTitle: config.defaultPageTitle,
      analyticsAccount: analyticsAccount,
      phaseBannerTag: config.phaseBannerTag,
      phaseBannerHtml: config.phaseBannerHtml
    }
  }
}
