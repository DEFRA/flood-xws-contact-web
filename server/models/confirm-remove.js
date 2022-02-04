const joi = require('joi')
const { BaseViewModel } = require('./form')

const PAGE_HEADING = 'Are you sure?'

const paramsSchema = joi.object().keys({
  id: joi.string().required()
}).required()

class ViewModel extends BaseViewModel {
  constructor (data, err) {
    super(data, err, {
      pageHeading: PAGE_HEADING
    })
  }
}

module.exports = {
  paramsSchema,
  ViewModel
}
