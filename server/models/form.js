const config = require('../config')

const baseMessages = {
  'string.max': '{{#label}} must be {{#limit}} characters or fewer'
}

class BaseViewModel {
  constructor (data = {}, err = new Errors(), { pageHeading, path, previousPath }) {
    this.data = data
    this.errorList = err
    this.errors = err.toMap()
    this.fields = {}
    this.pageHeading = pageHeading
    this.pageTitle = `${this.errorList.length ? 'Error: ' : ''}${pageHeading} - ${config.defaultPageTitle}`
    this.path = path
    this.previousPath = previousPath
  }

  addField (key, config) {
    this.fields[key] = config
  }
}

class Errors extends Array {
  toMap () {
    const map = Object.assign({}, ...this.map(e => {
      return { [e.key]: e }
    }))
    return map
  }

  static fromJoi (joiErr) {
    return new Errors(...joiErr.details.map(detail => {
      const key = detail.path[0]
      const text = detail.message

      return new ErrorDefinition(key, text)
    }))
  }
}

class ErrorDefinition {
  constructor (key, text) {
    this.key = key
    this.text = text
    this.href = `#${key}`
  }
}

module.exports = { baseMessages, BaseViewModel, Errors, ErrorDefinition }
