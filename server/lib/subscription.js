const AWS = require('aws-sdk')
const config = require('../config')
const { findAreasByPoint } = require('./area')
const { getContactById, getContactLocations } = require('./db')
const ddb = new AWS.DynamoDB.DocumentClient()
const { subscriptionTableName } = config

async function saveSubscriptions (contactId) {
  const contact = await getContactById(contactId)
  const contactLocations = await getContactLocations(contact.id)

  const contactSubscriptions = (await ddb.query({
    TableName: subscriptionTableName,
    IndexName: 'user-index',
    KeyConditionExpression: 'user_id = :user_id',
    ExpressionAttributeValues: {
      ':user_id': contactId
    }
  }).promise()).Items

  // Delete all current subscriptions
  if (Array.isArray(contactSubscriptions) && contactSubscriptions.length) {
    const req = {
      [subscriptionTableName]: contactSubscriptions.map(sub => ({
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
    const areas = await findAreasByPoint(contactLocation.x, contactLocation.y)

    for (let j = 0; j < areas.length; j++) {
      const area = areas[j]

      if (area.category_id === 'fwa' || contact.receive_messages === 'all') {
        // Email
        if (contact.email && contact.email_active) {
          await ddb.put({
            TableName: subscriptionTableName,
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
            TableName: subscriptionTableName,
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

    console.log(areas)
  }
}

module.exports = {
  saveSubscriptions
}
