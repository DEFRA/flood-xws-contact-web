const proj4 = require('proj4')
proj4.defs('OSGB', '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +datum=OSGB36 +units=m +no_defs')

const convert = {
  point: (x, y) => {
    return proj4('OSGB', 'WGS84', [x, y])
  },
  bbox: (xmin, ymin, xmax, ymax) => {
    return proj4('OSGB', 'WGS84', [xmin, ymin])
      .concat(proj4('OSGB', 'WGS84', [xmax, ymax]))
  }
}

module.exports = convert
