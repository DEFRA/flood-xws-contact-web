const { Pool } = require('pg')
const db = require('xws-shared/db')
const config = require('../config')

/**
 * Create pg pool instance and common helpers
 */
const pool = new Pool({
  connectionString: config.db
})

const { query, queryOne } = db(pool)

/**
 * Find a single contact by email or phone number in E164 format
 *
 * @param {string} value - The address or number
 */
async function findContact (value) {
  return queryOne(`
    select *
    from xws_contact.contact
    where value = $1
    limit 1
  `, [value])
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
 * @param {string} value - The URPN or OSGB ref
 * @param {('landline'|'email'|'mobile')} kind - The kind of contact
 */
async function insertContact (value, kind) {
  return queryOne(`
    insert into xws_contact.contact(value, contact_kind_name, hazard_name, contact_type_name)
    values($1, $2, $3, $4)
    returning *
  `, [value, kind, 'flood', 'public'])
}

/**
 * Insert a single location
 *
 * @param {string} ref - The URPN or OSGB ref
 * @param {string} name - Address or place name
 * @param {object} geom - The polygon representing the address or place
 * @param {object} centroid - The centroid representing the address or place
 */
async function insertLocation (ref, name, geom, centroid) {
  const type = ref.startsWith('osgb') ? 'osgb' : 'uprn'
  return queryOne(`
    insert into xws_contact.location(ref, location_type_name, name, geom, centroid)
    values($1, $2, $3, ST_SetSRID(ST_GeomFromGeoJSON($4), 4326), ST_SetSRID(ST_GeomFromGeoJSON($5), 4326))
    returning *
  `, [ref, type, name, geom, centroid])
}

/**
 * Insert a single link between a contact and a location
 *
 * @param {string} contactId - The contact record Id
 * @param {string} locationId - The location record Id
 * @param {string} channelName - The channel record Id
 * @param {boolean} wnlif - Warnings No Longer In Force flag
 * @param {boolean} alerts - Alerts flag
 */
async function insertSubscription (contactId, locationId, channelName, wnlif, alerts) {
  return queryOne(`
    insert into xws_contact.subscription(contact_id, location_id, channel_name, wnlif, alerts)
    values($1, $2, $3, $4, $5)
    returning *
  `, [contactId, locationId, channelName, wnlif, alerts])
}

/**
 * Get all locations for a given contact
 *
 * @param {string} contactId - The contact record Id
 */
async function getSubscriptions (contactId) {
  return query(`
    select s.id, s.contact_id, s.location_id, s.wnlif, s.alerts, l.name
    from xws_contact.subscription s
    join xws_contact.location l on l.id = s.location_Id
    where s.contact_id = $1;
  `, [contactId])
}

/**
 * Get a single location for a given contact
 *
 * @param {string} contactId - The contact record Id
 * @param {string} subscriptionId - The subscription record Id
 */
async function getSubscription (contactId, subscriptionId) {
  return queryOne(`
    select 
      s.id, s.contact_id, s.location_id, s.wnlif, s.alerts, l.name,
      (select EXISTS (select ar.code from xws_area.area ar where ar.area_type_ref = 'fwa' and st_intersects(l.geom, ar.geom))) as "hasWarning"
    from xws_contact.subscription s
    join xws_contact.location l on l.id = s.location_id
    where s.id = $1 and s.contact_id = $2
  `, [subscriptionId, contactId])
}

/**
 * Remove a contact location link
 *
 * @param {number} contactId - The contact record Id
 * @param {number} locationId - The location record Id
 */
async function removeSubscription (contactId, locationId) {
  return queryOne(`
    delete from xws_contact.subscription where contact_id = $1 and location_id = $2
  `, [contactId, locationId])
}

/**
 * Remove a contact location link
 *
 * @param {number} contactId - The contact record Id
 * @param {number} locationId - The location record Id
 */
async function updateSubscription (contactId, subscriptionId, wnlif, alerts) {
  return query(`
    update xws_contact.subscription
    set wnlif = $3, alerts = $4
    where contact_id = $1 and id = $2
  `, [contactId, subscriptionId, wnlif, alerts])
}
/**
 * Find all flood alert areas that intersect a point
 *
 * @param {number} x - The x co-ordinate (Easting/longitude)
 * @param {number} y - The y co-ordinate (Northing/latitude)
 */
async function findAlertAreasByPoint (x, y) {
  return query(`
    select *, st_asgeojson(geom) as geojson
    from xws_area.area ar
    where ar.area_type_ref = 'faa' and st_intersects(st_setsrid(st_makepoint($1, $2), 4326), ar.geom);`, [x, y])
}

/**
 * Find all flood warning areas that intersect a point
 *
 * @param {number} x - The x co-ordinate (Easting/longitude)
 * @param {number} y - The y co-ordinate (Northing/latitude)
 */
async function findWarningAreasByPoint (x, y) {
  return query(`
    select *, st_asgeojson(geom) as geojson
    from xws_area.area ar
    where ar.area_type_ref = 'fwa' and st_intersects(st_setsrid(st_makepoint($1, $2), 4326), ar.geom);`, [x, y])
}

/**
 * Find all flood alert areas that intersect a bounding box
 *
 * @param {number} xmin - The x-min co-ordinate (Easting/longitude)
 * @param {number} ymin - The y-max co-ordinate (Northing/latitude)
 * @param {number} xmax - The x-max co-ordinate (Easting/longitude)
 * @param {number} ymax - The y-max co-ordinate (Northing/latitude)
 */
async function findAlertAreasByBox (xmin, ymin, xmax, ymax) {
  return query(`
    select *, st_asgeojson(geom) as geojson
    from xws_area.area ar
    where ar.area_type_ref = 'faa' and st_intersects(st_setsrid(st_makeenvelope($1, $2, $3, $4), 4326), ar.geom);`, [xmin, ymin, xmax, ymax])
}

/**
 * Find all flood warning areas that intersect a bounding box
 *
 * @param {number} xmin - The x-min co-ordinate (Easting/longitude)
 * @param {number} ymin - The y-max co-ordinate (Northing/latitude)
 * @param {number} xmax - The x-max co-ordinate (Easting/longitude)
 * @param {number} ymax - The y-max co-ordinate (Northing/latitude)
 */
async function findWarningAreasByBox (xmin, ymin, xmax, ymax) {
  return query(`
    select *, st_asgeojson(geom) as geojson
    from xws_area.area ar
    where ar.area_type_ref = 'fwa' and st_intersects(st_setsrid(st_makeenvelope($1, $2, $3, $4), 4326), ar.geom);`, [xmin, ymin, xmax, ymax])
}

module.exports = {
  pool,
  query,
  queryOne,
  findContact,
  findLocation,
  insertContact,
  insertLocation,
  insertSubscription,
  getSubscription,
  getSubscriptions,
  removeSubscription,
  updateSubscription,
  findAlertAreasByPoint,
  findWarningAreasByPoint,
  findAlertAreasByBox,
  findWarningAreasByBox
}
