const Wreck = require('@hapi/wreck')
const interpolate = require('xws-shared/util/interpolate')
const {
  subscriptionPatchUrl,
  subscriptionPostUrl,
  subscriptionGetUrl,
  subscriptionDeleteUrl,
  contactSubscriptionGetUrl
} = require('../config.js')

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
    const [subscription] = JSON.parse(payload)
    return subscription
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
  getSubscription,
  getSubscriptions,
  updateSubscription,
  postSubscription,
  deleteSubscription
}
