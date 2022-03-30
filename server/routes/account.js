// const { saveSubscriptions } = require('../lib/subscription')
const { getContactById, getContactLocations, updateContact } = require('../lib/db')
const { SEVERITY_ITEMS, SEVERITY_ITEM_LABELS } = require('../models/locations')

const formatYesNo = val => {
  switch (val) {
    case true:
      return 'Yes'
    case false:
      return 'No'
    default:
      return ''
  }
}

const formatReceiveMessages = val => {
  return val
    ? SEVERITY_ITEM_LABELS[SEVERITY_ITEMS.indexOf(val)]
    : ''
}

module.exports = [
  {
    method: 'GET',
    path: '/account',
    handler: async (request, h) => {
      const { credentials } = request.auth
      const { id } = credentials
      const contact = await getContactById(id)
      const contactLocations = await getContactLocations(contact.id)

      const rows = [
        ['Email address', contact.email],
        ['Flood warning locations', { html: contactLocations.map(cl => cl.address).join('<br><br>') }, '/locations'],
        ['Which flood warnings do you need?', formatReceiveMessages(contact.receive_messages), '/locations'],
        ['Get warnings by email?', formatYesNo(contact.email_active), '/consent-email'],
        ['Get warnings by text?', formatYesNo(contact.mobile_active), '/mobile']
        // ['Get warnings by telephone call?', formatYesNo(contact.landline_active), '/consent-landline'],
        // ['Phone number', contact.landline, '/landline']
      ]

      if (contact.mobile_active) {
        rows.push(['Mobile number', contact.mobile, '/mobile'])
      }

      const map = item => ({
        key: { text: item[0] },
        value: typeof item[1] === 'string' ? { text: item[1] } : item[1],
        actions: item[2]
          ? { items: [{ href: item[2], text: 'Change', visuallyHiddenText: item[0] }] }
          : null
      })

      return h.view('account', { contact, rows: rows.map(map) })
    }
  },
  {
    method: 'POST',
    path: '/account',
    handler: async (request, h) => {
      const { credentials } = request.auth
      const { id } = credentials

      await updateContact(id, {
        last_confirmed: Date.now()
      })

      // Send subscription to DDB
      // await saveSubscriptions(id)

      return h.redirect('/confirmation')
    }
  }
]
