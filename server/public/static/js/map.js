;(function () {
  function map (geojson, target, capabilities, title, areasGeojson = []) {
    var ol = window.ol

    var vectorSource = new ol.source.Vector({
      features: (new ol.format.GeoJSON({
        dataProjection: 'EPSG:4326',
        featureProjection: 'EPSG:3857'
      })).readFeatures(geojson)
    })

    var styleFunction = function (feature) {
      var type = feature.getGeometry().getType()

      if (type === 'Point') {
        return new ol.style.Style({
          image: new ol.style.Icon({
            anchor: [0.5, 46],
            anchorXUnits: 'fraction',
            anchorYUnits: 'pixels',
            src: '/assets/icon-map-marker.png'
          })
        })
      }

      return new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'blue',
          width: 1
        }),
        fill: new ol.style.Fill({
          color: 'rgba(0, 0, 255, 0.1)'
        })
      })
    }

    var vectorLayer = new ol.layer.Vector({
      source: vectorSource,
      projection: 'EPSG:4326',
      style: styleFunction
    })

    // proj4.defs('EPSG:27700', '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 ' +
    //     '+x_0=400000 +y_0=-100000 +ellps=airy ' +
    //     '+towgs84=446.448,-125.157,542.06,0.15,0.247,0.842,-20.489 ' +
    //     '+units=m +no_defs')
    // ol.proj.proj4.register(proj4)

    // var proj27700 = ol.proj.get('EPSG:27700')
    // proj27700.setExtent([0, 0, 700000, 1300000])

    // var parser = new ol.format.WMTSCapabilities()
    // var result = parser.read(capabilities)

    // result.OperationsMetadata.GetTile.DCP.HTTP.Get[0].href = result.OperationsMetadata.GetTile.DCP.HTTP.Get[0].href.replace('http://', 'https://')

    // var options = ol.source.WMTS.optionsFromCapabilities(result, {
    //   layer: 'osgb',
    //   matrixSet: 'ZoomMap',
    //   crossOrigin: 'anonymous'
    // })

    // var source = new ol.source.WMTS(options)

    // // array of ol.tileRange can't find any reference to this object in ol3 documentation, but is set to NaN and stops the map from functioning
    // // openlayers doesn't expose fulltileranges as a property, so when using minified ol have to set tilegrid.a to null, which is what fulltileranges
    // // is mapped as, hopefully OS will fix their service, otherwise something more robust needs sorting out
    // source.tileGrid.fullTileRanges_ = null
    // source.tileGrid.a = null

    // var layer = new ol.layer.Tile({
    //   ref: 'osgb',
    //   source: source
    // })

    var osm = new ol.layer.Tile({
      source: new ol.source.OSM()
    })

    var extent = ol.proj.transformExtent([
      -5.75447,
      49.93027,
      1.799683,
      55.84093
    ], 'EPSG:4326', 'EPSG:3857')

    var map = new ol.Map({
      target: target,
      view: new ol.View({
        center: [0, 0],
        zoom: 2,
        extent
      }),
      layers: [osm].concat(areasGeojson).concat(vectorLayer),
      controls: ol.control.defaults({ attribution: false }).extend([
        new ol.control.FullScreen()
      ])
    })

    // map.setView(new ol.View({
    //   projection: 'EPSG:27700'
    // }))

    var ext = vectorSource.getExtent()
    var view = map.getView()
    view.fit(ext, map.getSize())

    if (ext[0] === ext[2]) { // Point
      view.setZoom(12)
    }

    // [0, 0, 700000, 1300000]
    map.on('singleclick', function (evt) {
      console.log(evt.coordinate.map(function (p) {
        return Math.round(p)
      }))
    })

    if (title) {
      var titleEl = document.createElement('h3')
      titleEl.textContent = title
      var mapEl = map.getTargetElement()
      mapEl.parentNode.insertBefore(titleEl, mapEl)
    }
  }

  window.XWS.map = map
})()
