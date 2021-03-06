const http = require('./http')
const { osApi } = require('../config')

async function findByPostcode (postcode) {
  const url = new URL(`${osApi.url}/search/places/v1/postcode`)
  const params = url.searchParams

  params.append('lr', 'EN')
  params.append('fq', 'logical_status_code:1')
  params.append('dataset', 'DPA')
  params.append('key', osApi.key)
  params.append('postcode', postcode)
  params.append('output_srs', 'EPSG:4326')

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
        x: item.LNG,
        y: item.LAT
      }
    })
}

async function findByName (query) {
  const url = new URL(`${osApi.url}/search/names/v1/find`)
  const params = url.searchParams
  const localTypes = ['City', 'Town', 'Village', 'Suburban_Area', 'Other_Settlement', 'Hamlet']

  params.append('maxresults', '10')
  params.append('fq', localTypes.map(lt => `LOCAL_TYPE:${lt}`).join(' '))
  params.append('key', osApi.key)
  params.append('query', query)

  console.log(url.href)

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
  findByName,
  findByPostcode
}
