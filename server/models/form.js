const config = require('../config')

function mapErrors (err) {
  const errors = {}
  const errorList = []

  if (err && Array.isArray(err.details)) {
    err.details.forEach(error => {
      const path = error.path[0]
      const text = error.message
      const type = error.type

      errors[path] = { text, type }
      errorList.push({ text, type, path, href: `#${path}` })
    })
  }

  return [
    errors,
    errorList
  ]
}

const baseMessages = {
  'string.max': '{{#label}} must be {{#limit}} characters or fewer'
}

class BaseViewModel {
  constructor (data = {}, err, { pageHeading, path, previousPath }) {
    const [errors, errorList] = mapErrors(err)
    this.data = data
    this.errors = errors
    this.errorList = errorList
    this.fields = {}
    this.pageHeading = pageHeading
    this.pageTitle = `${errorList.length ? 'Error: ' : ''}${pageHeading} - ${config.defaultPageTitle}`
    this.path = path
    this.previousPath = previousPath
  }

  addField (key, config) {
    this.fields[key] = config
  }
}

module.exports = { mapErrors, baseMessages, BaseViewModel }
