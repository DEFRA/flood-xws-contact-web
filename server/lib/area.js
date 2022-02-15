const db = require('./db')

/**
 * Find all flood areas that intersect a point
 *
 * @param {number} x - The x co-ordinate (Easting/longitude)
 * @param {number} y - The y co-ordinate (Northing/latitude)
 */
async function findAreasByPoint (x, y) {
  return db.query(`
    select *
    from xws_area.area a
    where st_intersects(st_setsrid(st_makepoint($1, $2), 4326), a.geom);`, [x, y])
}

// /**
//  * Find all flood alert areas that intersect a point
//  *
//  * @param {number} x - The x co-ordinate (Easting/longitude)
//  * @param {number} y - The y co-ordinate (Northing/latitude)
//  */
// async function findAlertAreasByPoint (x, y) {
//   return db.query(`
//     select *, st_asgeojson(geom) as geojson
//     from xws_area.area a
//     where a.area_type_ref = 'faa' and st_intersects(st_setsrid(st_makepoint($1, $2), 4326), a.geom);`, [x, y])
// }

// /**
//  * Find all flood warning areas that intersect a point
//  *
//  * @param {number} x - The x co-ordinate (Easting/longitude)
//  * @param {number} y - The y co-ordinate (Northing/latitude)
//  */
// async function findWarningAreasByPoint (x, y) {
//   return db.query(`
//     select *, st_asgeojson(geom) as geojson
//     from xws_area.area a
//     where a.area_type_ref = 'fwa' and st_intersects(st_setsrid(st_makepoint($1, $2), 4326), a.geom);`, [x, y])
// }

/**
 * Returns true if flood areas intersect a point
 *
 * @param {number} x - The x co-ordinate (Easting/longitude)
 * @param {number} y - The y co-ordinate (Northing/latitude)
 */
async function areasIntersectPoint (x, y) {
  return db.queryOne(`
    select exists(
      select code from xws_area.area a
      where st_intersects(st_setsrid(st_makepoint($1, $2), 4326), a.geom) limit 1
    );`, [x, y])
}

// /**
//  * Find all flood areas that intersect a bounding box
//  *
//  * @param {number} xmin - The x-min co-ordinate (Easting/longitude)
//  * @param {number} ymin - The y-max co-ordinate (Northing/latitude)
//  * @param {number} xmax - The x-max co-ordinate (Easting/longitude)
//  * @param {number} ymax - The y-max co-ordinate (Northing/latitude)
//  */
// async function findAreasByBox (xmin, ymin, xmax, ymax) {
//   return db.query(`
//     select *
//     from xws_area.area a
//     where st_intersects(st_setsrid(st_makeenvelope($1, $2, $3, $4), 4326), a.geom);`, [xmin, ymin, xmax, ymax])
// }

// /**
//  * Find all flood alert areas that intersect a bounding box
//  *
//  * @param {number} xmin - The x-min co-ordinate (Easting/longitude)
//  * @param {number} ymin - The y-max co-ordinate (Northing/latitude)
//  * @param {number} xmax - The x-max co-ordinate (Easting/longitude)
//  * @param {number} ymax - The y-max co-ordinate (Northing/latitude)
//  */
// async function findAlertAreasByBox (xmin, ymin, xmax, ymax) {
//   return db.query(`
//     select *, st_asgeojson(geom) as geojson
//     from xws_area.area a
//     where a.area_type_ref = 'faa' and st_intersects(st_setsrid(st_makeenvelope($1, $2, $3, $4), 4326), a.geom);`, [xmin, ymin, xmax, ymax])
// }

// /**
//  * Find all flood warning areas that intersect a bounding box
//  *
//  * @param {number} xmin - The x-min co-ordinate (Easting/longitude)
//  * @param {number} ymin - The y-max co-ordinate (Northing/latitude)
//  * @param {number} xmax - The x-max co-ordinate (Easting/longitude)
//  * @param {number} ymax - The y-max co-ordinate (Northing/latitude)
//  */
// async function findWarningAreasByBox (xmin, ymin, xmax, ymax) {
//   return db.query(`
//     select *, st_asgeojson(geom) as geojson
//     from xws_area.area a
//     where a.area_type_ref = 'fwa' and st_intersects(st_setsrid(st_makeenvelope($1, $2, $3, $4), 4326), a.geom);`, [xmin, ymin, xmax, ymax])
// }

/**
 * Returns true if flood areas intersect a bounding box
 *
 * @param {number} xmin - The x-min co-ordinate (Easting/longitude)
 * @param {number} ymin - The y-max co-ordinate (Northing/latitude)
 * @param {number} xmax - The x-max co-ordinate (Easting/longitude)
 * @param {number} ymax - The y-max co-ordinate (Northing/latitude)
 */
async function areasIntersectBox (xmin, ymin, xmax, ymax) {
  return db.queryOne(`
    select exists(
      select code from xws_area.area a
      where st_intersects(st_setsrid(st_makeenvelope($1, $2, $3, $4), 4326), a.geom) limit 1
    );`, [xmin, ymin, xmax, ymax])
}

module.exports = {
  areasIntersectPoint,
  findAreasByPoint,
  // findAlertAreasByPoint,
  // findWarningAreasByPoint,
  areasIntersectBox
  // findAreasByBox,
  // ,
  // findAlertAreasByBox,
  // findWarningAreasByBox
}
