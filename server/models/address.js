const joi = require('joi')
const { BaseViewModel, baseMessages } = require('./form')

const PAGE_HEADING = 'Select an address'
const ADDRESS_KEY = 'address'
const ADDRESS_LABEL = 'Address'
const ADDRESS_MESSAGES = {
  'number.base': PAGE_HEADING
}

const schema = joi.object().keys({
  [ADDRESS_KEY]: joi.number().label(ADDRESS_LABEL).required().messages(ADDRESS_MESSAGES),
  postcode: joi.string().required()
}).messages(baseMessages).required()

class ViewModel extends BaseViewModel {
  constructor (data, err, addresses) {
    super(data, err, {
      pageHeading: PAGE_HEADING,
      path: '/location'
    })

    const defaultOption = {
      text: addresses.length === 1
        ? '1 address found'
        : `${addresses.length} addresses found`
    }

    const items = [defaultOption].concat(addresses.map((addr, i) => ({
      text: addr.address,
      value: i
    })))

    this.addField(ADDRESS_KEY, {
      id: ADDRESS_KEY,
      name: ADDRESS_KEY,
      label: {
        text: PAGE_HEADING,
        isPageHeading: false
      },
      items,
      value: this.data.address,
      errorMessage: this.errors.address
    })
  }
}

module.exports = {
  schema,
  ViewModel,
  ADDRESS_KEY
}
