const AWS = require('aws-sdk')
const { removeKeys } = require('flood-xws-common/helpers')
const config = require('../config')
const ddb = new AWS.DynamoDB.DocumentClient()
const tableName = config.contactTableName

function formatContact (contact) {
  const keysToRemove = ['pk', 'sk']
  contact.id = contact.pk
  return removeKeys(contact, keysToRemove)
}

function formatLocation (location) {
  const keysToRemove = ['pk', 'sk']
  location.id = location.sk.substr(2)
  return removeKeys(location, keysToRemove)
}

/**
 * Update a record
 *
 * @param {string} id - The id
 */
async function update (pk, sk, data) {
  const attrs = Object.keys(data)

  const params = {
    TableName: tableName,
    Key: { pk, sk },
    ExpressionAttributeValues: {},
    ExpressionAttributeNames: {},
    UpdateExpression: '',
    ReturnValues: 'ALL_NEW'
  }

  attrs.forEach((attr, index) => {
    const prefix = (!index ? 'set' : ',')
    params.UpdateExpression += prefix + ' #' + attr + ' = :' + attr
    params.ExpressionAttributeValues[':' + attr] = data[attr]
    params.ExpressionAttributeNames['#' + attr] = attr
  })

  const result = await ddb.update(params).promise()

  return result.Attributes
}

/**
 * Update a single contact by id
 *
 * @param {string} email - The contact id (email)
 */
async function updateContact (id, data) {
  const contact = await update(id, 'C', data)
  return formatContact(contact)
}

/**
 * Insert a single location
 *
 * @param {string} contactId - The contact id
 * @param {string} ref - The location reference
 * @param {object} data - The location data
 * @param {string} type - The location type
 */
// TODO: Make location - contact unique UPRN
async function insertContactLocation (contactId, ref, data, type = 'uprn') {
  const location = await update(contactId, `L#${type.toUpperCase()}#${ref}`, data)
  return formatLocation(location)
}

/**
 * Find a single contact by email or phone number in E164 format
 *
 * @param {string} value - The address or number
 */
async function findContact (value) {
  return ddb.get({
    TableName: tableName,
    Key: {
      id: value
    }
  }).promise()
}

/**
 * Find a single contact by id
 *
 * @param {string} id - The contact id
 */
async function getContactById (id) {
  const result = await ddb.get({
    TableName: tableName,
    Key: {
      pk: id,
      sk: 'C'
    }
  }).promise()

  return formatContact(result.Item)
}

/**
 * Get all locations for a given contact
 *
 * @param {string} contactId - The contact record Id
 */
async function getContactLocations (contactId) {
  const result = await ddb.query({
    KeyConditionExpression: 'pk = :pk and begins_with(sk, :sk)',
    ExpressionAttributeValues: {
      ':pk': contactId,
      ':sk': 'L#'
    },
    TableName: tableName
  }).promise()

  return result.Items.map(formatLocation)
}

/**
 * Get a single contact location for a given contact
 *
 * @param {string} contactId - The contact record Id
 * @param {string} locationId - The contact location record Id
 */
async function getContactLocation (contactId, locationId) {
  const result = await ddb.get({
    TableName: tableName,
    Key: {
      pk: contactId,
      sk: `L#${locationId}`
    }
  }).promise()

  return formatLocation(result.Item)
}

/**
 * Remove a single location for a given contact
 *
 * @param {string} contactId - The contact record id
 * @param {string} contactId - The location record id
 */
async function removeContactLocation (contactId, locationId) {
  const result = await ddb.delete({
    TableName: tableName,
    Key: {
      pk: contactId,
      sk: `L#${locationId}`
    }
  }).promise()

  return result
}

module.exports = {
  updateContact,
  findContact,
  getContactById,
  insertContactLocation,
  getContactLocation,
  getContactLocations,
  removeContactLocation
}
