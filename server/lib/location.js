const http = require('./http')
const { os } = require('../config')
const { placesKey, namesKey } = os

async function findByUprn (id) {
  const url = new URL('https://api.ordnancesurvey.co.uk/places/v1/addresses/uprn')
  const params = url.searchParams

  params.append('lr', 'EN')
  params.append('fq', 'logical_status_code:1')
  params.append('dataset', 'DPA')
  params.append('key', placesKey)
  params.append('uprn', id)

  const payload = await http.getJson(url.href, true)

  if (!payload || !payload.results || payload.results.length !== 1) {
    throw new Error('Invalid response')
  }

  const result = payload.results[0].DPA
  const address = {
    uprn: result.UPRN,
    nameOrNumber: result.BUILDING_NUMBER || result.BUILDING_NAME || result.ORGANISATION_NAME,
    postcode: result.POSTCODE,
    x: result.X_COORDINATE,
    y: result.Y_COORDINATE,
    address: result.ADDRESS
  }

  return address
}

async function findByPostcode (postcode) {
  const url = new URL('https://api.ordnancesurvey.co.uk/places/v1/addresses/postcode')
  const params = url.searchParams

  params.append('lr', 'EN')
  params.append('fq', 'logical_status_code:1')
  params.append('dataset', 'DPA')
  params.append('key', placesKey)
  params.append('postcode', postcode)

  const payload = await http.getJson(url.href, true)

  if (!payload || !payload.results || !payload.results.length) {
    return []
  }

  const results = payload.results.map(item => item.DPA)

  return results
    .map(item => {
      return {
        uprn: item.UPRN,
        postcode: item.POSTCODE,
        address: item.ADDRESS,
        x: item.X_COORDINATE,
        y: item.Y_COORDINATE
      }
    })
}

async function findByName (query) {
  const url = new URL('https://api.ordnancesurvey.co.uk/opennames/v1/find')
  const params = url.searchParams
  const localTypes = ['City', 'Town', 'Village', 'Suburban_Area', 'Other_Settlement', 'Hamlet']

  params.append('maxresults', '10')
  params.append('fq', localTypes.map(lt => `LOCAL_TYPE:${lt}`).join(' '))
  params.append('key', namesKey)
  params.append('query', query)

  const payload = await http.getJson(url.href, true)

  if (!payload || !payload.results || !payload.results.length) {
    return []
  }

  return payload.results
    .map(r => r.GAZETTEER_ENTRY)
    .map(item => {
      return {
        id: item.ID,
        name: item.NAME1,
        county: item.COUNTY_UNITARY,
        type: item.TYPE,
        localType: item.LOCAL_TYPE,
        country: item.COUNTRY,
        district: item.DISTRICT_BOROUGH,
        postcodeDistrict: item.POSTCODE_DISTRICT,
        x: item.GEOMETRY_X,
        y: item.GEOMETRY_Y,
        xmax: item.MBR_XMAX,
        xmin: item.MBR_XMIN,
        ymax: item.MBR_YMAX,
        ymin: item.MBR_YMIN,
        item
      }
    })
}

module.exports = {
  findByUprn,
  findByName,
  findByPostcode
}
