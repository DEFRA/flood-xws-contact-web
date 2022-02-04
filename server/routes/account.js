const { getContactLocations } = require('../lib/db')
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
      const { contact } = credentials
      const contactLocations = await getContactLocations(contact.id)

      const rows = [
        ['Email address', contact.email],
        ['Flood warning locations', { html: contactLocations.map(cl => cl.name).join('<br><br>') }, '/locations'],
        ['Which flood warnings do you need?', formatReceiveMessages(contact.receive_messages), '/locations'],
        ['Get warnings by email?', formatYesNo(contact.email_active), '/consent-email'],
        ['Get warnings by text?', formatYesNo(contact.mobile_active), '/consent-mobile'],
        ['Mobile number', contact.mobile, '/mobile'],
        ['Get warnings by telephone call?', formatYesNo(contact.landline_active), '/consent-landline'],
        ['Phone number', contact.landline, '/landline']
      ].map(item => ({
        key: { text: item[0] },
        value: typeof item[1] === 'string' ? { text: item[1] } : item[1],
        actions: {
          items: [{ href: item[2], text: 'Change', visuallyHiddenText: item[0] }]
        }
      }))

      return h.view('account', { contact, rows })
    }
  }
]
