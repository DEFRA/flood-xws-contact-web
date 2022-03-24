
const AWS = require('aws-sdk')
const config = require('../config')
const { findAreasByPoint } = require('./area')
const { getContactById, getContactLocations, getLocation } = require('./db')
const ddb = new AWS.DynamoDB.DocumentClient()
const tableName = config.subscriptionTableName

async function saveSubscriptions (contactId) {
  const contact = await getContactById(contactId)
  const contactLocations = await getContactLocations(contact.id)

  const contactSubscriptions = (await ddb.query({
    TableName: tableName,
    IndexName: 'user-index',
    KeyConditionExpression: 'user_id = :user_id',
    ExpressionAttributeValues: {
      ':user_id': contactId
    }
  }).promise()).Items

  // Delete all current subscriptions
  if (Array.isArray(contactSubscriptions) && contactSubscriptions.length) {
    const req = {
      [tableName]: contactSubscriptions.map(sub => ({
        DeleteRequest: {
          Key: {
            code: sub.code,
            endpoint: sub.endpoint
          }
        }
      }))
    }

    await ddb.batchWrite({
      RequestItems: req
    }).promise()
  }

  console.log(contact, contactLocations, contactSubscriptions)

  for (let i = 0; i < contactLocations.length; i++) {
    const contactLocation = contactLocations[i]
    const location = await getLocation(contactLocation.location_id)
    const centroid = JSON.parse(location.centroid_geo)
    const areas = await findAreasByPoint(centroid.coordinates[0], centroid.coordinates[1])

    for (let j = 0; j < areas.length; j++) {
      const area = areas[j]

      if (area.category_id === 'fwa' || contact.receive_messages === 'all') {
        // Email
        if (contact.email && contact.email_active) {
          await ddb.put({
            TableName: tableName,
            Item: {
              code: area.code,
              endpoint: contact.email,
              user_id: contact.id,
              channel: 'email'
            }
          }).promise()
        }

        // SMS
        if (contact.mobile && contact.mobile_active) {
          await ddb.put({
            TableName: tableName,
            Item: {
              code: area.code,
              endpoint: contact.mobile,
              user_id: contact.id,
              channel: 'sms'
            }
          }).promise()
        }
      }
    }

    console.log(areas, location, centroid)
  }
}

module.exports = {
  saveSubscriptions
}
