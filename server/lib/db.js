const { Pool } = require('pg')
const db = require('flood-xws-common/db')
const config = require('../config')

/**
 * Create pg pool instance and common helpers
 */
const pool = new Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseSsl
})

const { query, queryOne } = db(pool)

/**
 * Find a single contact by email or phone number in E164 format
 *
 * @param {string} value - The address or number
 */
async function findContact (value) {
  return queryOne('select * from xws_contact.contact where email = $1 limit 1', [value])
}

/**
 * Find a single location by UPRN or OSGB ref
 *
 * @param {string} ref - The URPN or OSGB ref
 */
async function findLocation (ref) {
  return queryOne('select * from xws_contact.location where ref = $1 limit 1', [ref])
}

/**
 * Insert a single contact
 *
 * @param {string} email - The email address
 */
async function insertContact (email) {
  return queryOne(`
    insert into xws_contact.contact(email, state, hazard, type)
    values($1, $2, $3, $4)
    returning *
  `, [email, 'active', 'flood', 'public'])
}

/**
 * Update a single contacts mobile
 *
 * @param {string} id - The contact id
 * @param {string} mobile - The mobile number
 */
async function updateContactMobile (id, mobile) {
  return queryOne(`
    update xws_contact.contact
    set mobile = $2, updated_at = CURRENT_TIMESTAMP
    where id = $1
    returning *
  `, [id, mobile])
}

/**
 * Update a single contacts text consent
 *
 * @param {string} id - The contact id
 * @param {string} mobile - The text consent
 */
async function updateContactMobileActive (id, active) {
  return queryOne(`
    update xws_contact.contact
    set mobile_active = $2, updated_at = CURRENT_TIMESTAMP
    where id = $1
    returning *
  `, [id, active])
}

/**
 * Update a single contacts text consent
 *
 * @param {string} id - The contact id
 * @param {string} mobile - The email consent
 */
async function updateContactEmailActive (id, active) {
  return queryOne(`
    update xws_contact.contact
    set email_active = $2, updated_at = CURRENT_TIMESTAMP
    where id = $1
    returning *
  `, [id, active])
}

/**
 * Update a single contacts mobile
 *
 * @param {string} id - The contact id
 * @param {string} telephone - The landline number
 */
async function updateContactLandline (id, landline) {
  return queryOne(`
    update xws_contact.contact
    set landline = $2, updated_at = CURRENT_TIMESTAMP
    where id = $1
    returning *
  `, [id, landline])
}

/**
 * Update a single contacts landline consent
 *
 * @param {string} id - The contact id
 * @param {string} active - The landline consent
 */
async function updateContactLandlineActive (id, active) {
  return queryOne(`
    update xws_contact.contact
    set landline_active = $2, updated_at = CURRENT_TIMESTAMP
    where id = $1
    returning *
  `, [id, active])
}

/**
 * Update a single contacts receive messages flag
 *
 * @param {string} id - The contact id
 * @param {string} receiveMessages - The receive_messages flag
 */
async function updateContactReceiveMessages (id, receiveMessages) {
  return queryOne(`
    update xws_contact.contact
    set receive_messages = $2, updated_at = CURRENT_TIMESTAMP
    where id = $1
    returning *
  `, [id, receiveMessages])
}

/**
 * Insert a single location
 *
 * @param {string} ref - The URPN or OSGB ref
 * @param {string} type - The location type
 * @param {string} name - Address or place name
 */
async function insertLocation (ref, name, x, y, xmin, ymin, xmax, ymax) {
  const type = ref.startsWith('osgb') ? 'osgb' : 'uprn'
  // const centroid = `ST_MakePoint(${x}, ${y})`
  // const boundingBox = type === 'osgb' ? `ST_MakeEnvelope(${xmin}, ${ymin}, ${xmax}, ${ymax}])` : null
  // const geom = type === 'osgb' ? boundingBox : centroid

  return queryOne(`
    insert into xws_contact.location(ref, type, name, geom, centroid, bounding_box)
    values(
      $1, $2, $3,
      CASE $2 WHEN 'uprn' THEN ST_SetSRID(ST_MakePoint($4, $5), 4326) ELSE ST_SetSRID(ST_MakeEnvelope($6, $7, $8, $9), 4326) END,
      ST_SetSRID(ST_MakePoint($4, $5), 4326),
      CASE $2 WHEN 'uprn' THEN NULL ELSE ST_SetSRID(ST_MakeEnvelope($6, $7, $8, $9), 4326) END
    )
    returning *
  `, [ref, type, name, x, y, xmin, ymin, xmax, ymax])
}

/**
 * Insert a single link between a contact and a location
 *
 * @param {string} contactId - The contact record Id
 * @param {string} locationId - The location record Id
 */
async function insertContactLocation (contactId, locationId) {
  return queryOne(`
    insert into xws_contact.contact_location(contact_id, location_id)
    values($1, $2)
    returning *
  `, [contactId, locationId])
}

/**
 * Get all locations for a given contact
 *
 * @param {string} contactId - The contact record Id
 */
async function getContactLocations (contactId) {
  return query(`
    select cl.id, cl.contact_id, cl.location_id, l.name
    from xws_contact.contact_location cl
    join xws_contact.location l on l.id = cl.location_id
    where cl.contact_id = $1;
  `, [contactId])
}

// /**
//  * Get a single location for a given contact
//  *
//  * @param {string} contactId - The contact record Id
//  * @param {string} subscriptionId - The subscription record Id
//  */
// async function getSubscription (contactId, subscriptionId) {
//   return queryOne(`
//     select
//       s.id, s.contact_id, s.location_id, s.wnlif, s.alerts, l.name,
//       (select EXISTS (select ar.code from xws_area.area ar where ar.area_type_ref = 'fwa' and st_intersects(l.geom, ar.geom))) as "hasWarning"
//     from xws_contact.subscription s
//     join xws_contact.location l on l.id = s.location_id
//     where s.id = $1 and s.contact_id = $2
//   `, [subscriptionId, contactId])
// }

// /**
//  * Remove a contact location link
//  *
//  * @param {number} contactId - The contact record Id
//  * @param {number} locationId - The location record Id
//  */
// async function removeSubscription (contactId, locationId) {
//   return queryOne(`
//     delete from xws_contact.subscription where contact_id = $1 and location_id = $2
//   `, [contactId, locationId])
// }

// /**
//  * Remove a contact location link
//  *
//  * @param {number} contactId - The contact record Id
//  * @param {number} locationId - The location record Id
//  */
// async function updateSubscription (contactId, subscriptionId, wnlif, alerts) {
//   return query(`
//     update xws_contact.subscription
//     set wnlif = $3, alerts = $4
//     where contact_id = $1 and id = $2
//   `, [contactId, subscriptionId, wnlif, alerts])
// }

module.exports = {
  pool,
  query,
  queryOne,
  findContact,
  findLocation,
  insertContact,
  updateContactMobile,
  updateContactMobileActive,
  updateContactLandline,
  updateContactLandlineActive,
  updateContactEmailActive,
  updateContactReceiveMessages,
  insertLocation,
  getContactLocations,
  insertContactLocation
  // insertSubscription,
  // getSubscription,
  // getSubscriptions,
  // removeSubscription,
  // updateSubscription
}
