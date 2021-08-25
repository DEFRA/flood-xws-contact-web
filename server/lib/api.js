const Wreck = require('@hapi/wreck')
const interpolate = require('xws-shared/util/interpolate')
const {
  contactGetUrl,
  contactPostUrl,
  subscriptionPatchUrl,
  subscriptionPostUrl,
  subscriptionGetUrl,
  subscriptionDeleteUrl,
  contactSubscriptionGetUrl
} = require('../config.js')

async function postContact (value, contactKindName) {
  try {
    const contactDetails = {
      value,
      contactKindName,
      active: true,
      contactTypeName: 'public',
      hazardName: 'flood'
    }
    const { payload } = await Wreck.post(contactPostUrl, { headers: { Prefer: 'return=representation' }, payload: contactDetails })
    const [contact] = JSON.parse(payload)
    return contact
  } catch (error) {
    console.log({ contactPostUrl, error })
  }
}

async function getContact (value) {
  try {
    const url = interpolate(contactGetUrl, { value })
    const { payload } = await Wreck.get(url)
    const [contact] = JSON.parse(payload)
    return contact
  } catch (error) {
    console.error({ contactGetUrl, error })
  }
}

async function postSubscription (contactId, areaCode, channelName, wnlif) {
  try {
    const payload = {
      contactId,
      areaCode,
      channelName,
      wnlif
    }
    const { res } = await Wreck.post(subscriptionPostUrl, { payload })
    return res.statusCode
  } catch (error) {
    console.log({ subscriptionPostUrl, error })
  }
}

async function getSubscriptions (contactId) {
  try {
    const url = interpolate(contactSubscriptionGetUrl, { contactId })
    const { payload } = await Wreck.get(url)
    const [contact] = JSON.parse(payload)
    return contact.subscription
  } catch (error) {
    console.error({ contactSubscriptionGetUrl, error })
  }
}

async function getSubscription (subscriptionId) {
  try {
    const url = interpolate(subscriptionGetUrl, { subscriptionId })
    const { payload } = await Wreck.get(url)
    return JSON.parse(payload)
  } catch (error) {
    console.error({ subscriptionGetUrl, error })
  }
}

async function updateSubscription (subscriptionId, wnlif) {
  try {
    const patchData = { wnlif }
    const url = interpolate(subscriptionPatchUrl, { subscriptionId })
    const { res } = await Wreck.patch(url, { payload: patchData })
    return res.statusCode
  } catch (error) {
    console.error({ subscriptionPatchUrl, error })
  }
}

async function deleteSubscription (subscriptionId) {
  try {
    const url = interpolate(subscriptionDeleteUrl, { subscriptionId })
    const { res } = await Wreck.delete(url)
    return res.statusCode
  } catch (error) {
    console.error({ subscriptionPatchUrl, error })
  }
}

module.exports = {
  getContact,
  postContact,
  getSubscription,
  getSubscriptions,
  updateSubscription,
  postSubscription,
  deleteSubscription
}
