const Wreck = require('@hapi/wreck')
const { areaUrl } = require('../config.js')

async function findAreasByPoint (x, y, type) {
  try {
    const coord = `${x},${y}`
    const { payload } = await Wreck.get(`${areaUrl}?type=${type}&coord=${coord}`)
    const result = JSON.parse(payload)
    return result
  } catch (error) {
    console.error({ areaUrl, error })
  }
}

async function findAreasByBox (xmin, ymin, xmax, ymax, type) {
  try {
    const bbox = `${xmin},${ymin},${xmax},${ymax}`
    const { payload } = await Wreck.get(`${areaUrl}?type=${type}&bbox=${bbox}`)
    const result = JSON.parse(payload)
    return result
  } catch (error) {
    console.error({ areaUrl, error })
  }
}

async function findAlertAreasByPoint (x, y) {
  return findAreasByPoint(x, y, 'faa')
}

/**
 * Find all flood warning areas that intersect a point
 *
 * @param {number} x - The x co-ordinate (Easting/longitude)
 * @param {number} y - The y co-ordinate (Northing/latitude)
 */
async function findWarningAreasByPoint (x, y) {
  return findAreasByPoint(x, y, 'fwa')
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
  return findAreasByBox(xmin, ymin, xmax, ymax, 'faa')
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
  return findAreasByBox(xmin, ymin, xmax, ymax, 'fwa')
}

module.exports = {
  findAlertAreasByPoint,
  findWarningAreasByPoint,
  findAlertAreasByBox,
  findWarningAreasByBox
}
