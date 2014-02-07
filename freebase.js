/**
 * @fileoverview Combines aggregate data on genders/professions by location
 * with geometries (via DynamicMapsEngineLayer) and attributes (via GME API).
 * TODO(jlivni): Display hover effect for individual location circles
 * add toggle for switching to circles and countries
 * color circles by profession/gender
 */


// Don't display profession with less than this many results [people].
var MIN_MATCHES = 1500; // ~30 professions with >1500 results

var pmap = {
  map: null,
  stats: null,
  currentOverlays: [],
  currentProfession: 'Actor', // default
  currentDisplay: 'countries',
  //countryLayer: '04099529906692753140-17822344884942484754',
  countryLayer: '04099529906692753140-06885318028201431845',
  //countryTable: '04099529906692753140-15743085520785048593',
  countryTable: '04099529906692753140-02637662305072978107',
  featureTable: '04099529906692753140-09195451338740673751',
  apiKey: 'AIzaSyBZc4U5HmHJXnglbPJSahetB4z_NtEyoPg',
  baseStyle: [
    {
      'stylers': [
        { 'visibility': 'off' }
      ]
    },{
      'featureType': 'water',
      'stylers': [
        { 'visibility': 'simplified' },
        { 'color': '#888' }
      ]
    },{
      'featureType': 'landscape',
      'stylers': [
        { 'visibility': 'simplified' },
        { 'color': '#ccc' }
      ]
    }
  ]
};


/**
 * Get the URL for the features endpoint of a given table id.
 * @param {string} tableId the id of the table.
 * @return {string} URL of the featured endpoint.
 */
pmap.getTableUrl = function(tableId) {
  var tableUrl = 'https://www.googleapis.com/mapsengine/v1/tables/';
  return tableUrl + [tableId, 'features'].join('/');
};

/**
 * Initializes the map, sets up base click listeners.
 */
pmap.initialize = function() {
  var mapOptions = {
    zoom: 2,
    disableDefaultUI: true,
    center: new google.maps.LatLng(25.8, -187.3),
    styles: pmap.baseStyle
  };

  pmap.map = new google.maps.Map(document.getElementById('map-canvas'),
      mapOptions);

  var controls = pmap.map.controls;
  controls[google.maps.ControlPosition.TOP_RIGHT].push($('#legend')[0]);
  controls[google.maps.ControlPosition.RIGHT_TOP].push($('#status')[0]);
  controls[google.maps.ControlPosition.TOP_LEFT].push($('#selection')[0]);
  controls[google.maps.ControlPosition.TOP_CENTER].push($('#layer-toggle')[0]);

  // get local professions aggregation by country

  pmap.setupStats();
  var params = {
    key: pmap.apiKey,
    version: 'published',
    maxResults: 1000
  };
  $.getJSON(pmap.getTableUrl(pmap.featureTable), params, pmap.getFeatureData);

  pmap.displayLayers();
  pmap.addLegend();
};

pmap.toggleLayerDisplay = function(layer) {
  pmap.currentDisplay = layer;
  if (layer == 'countries') {
    pmap.recolorCountries(pmap.currentProfession);
  } else {
    pmap.displayLocations(pmap.currentProfession)
  }
}
pmap.loadProfessions = function(response) {
  allProfessions = {};
  // we know country data already loaded
  $.each(response, function(i, location) {
    var freebase_code = location[1];
    var location_obj = pmap.stats.locations[freebase_code];
    var country_code = location[2];
    var feature_id = pmap.stats.lookups.countries[country_code];
    var country_obj = pmap.stats.countries[feature_id];
    var professions = location[8];
    $.each(professions, function(profession, counts) {
      // might be undefined, so set as 0
      counts['m'] = counts['m'] || 0;
      counts['f'] = counts['f'] || 0;
      // check to see if country has the professions already, if not add
      if (profession in country_obj.professions) {
        country_obj.professions[profession]['m'] += counts['m'];
        country_obj.professions[profession]['f'] += counts['f'];
      } else {
        country_obj.professions[profession] = {
          'm': counts['m'],
          'f': counts['f']
        };
      }
      // check to see if location has the professions already, if not add
      if (!location_obj) {console.log(freebase_code)}
      if (profession in location_obj.professions) {
        location_obj.professions[profession]['m'] += counts['m'];
        location_obj.professions[profession]['f'] += counts['f'];
      } else {
        location_obj.professions[profession] = {
          'm': counts['m'],
          'f': counts['f']
        };
      }
      // also check to see if it's in the dropdown
      if (profession in allProfessions) {
        allProfessions[profession]['m'] += counts['m'];
        allProfessions[profession]['f'] += counts['f'];
      } else {
        allProfessions[profession] = counts;
      }
    });
  });
  var professionsOrdered = [];

  $.each(allProfessions, function(title, profession) {
    profession.title = title;
    professionsOrdered.push(profession);
  });
  professionsOrdered.sort(function(a, b) {
    return (((b.f || 1) / (b.m || 1)) - ((a.f || 1) / (a.m) || 1));
  });
  $.each(professionsOrdered, function(i, profession) {
    var percentage = profession.m / (profession.m + profession.f);
    var color = getColorForPercentage(percentage);
    // create dropdown
    if ((profession.m + profession.f) < MIN_MATCHES) { return;}
    $('#professions')
      .append(
        $('<li></li>')
        .attr('value', profession.title)
        .attr('id', 'sidebar_' + profession.title)
        .text(profession.title)
        .css('color', color)
        .click(function(e) {
          $('#status').html('');
          $('.selected').removeClass('selected');
          pmap.currentProfession = $(this).text();
          $(this).addClass('selected');
          //pmap.recolorCountries(pmap.currentProfession);
          //pmap.displayLocations(pmap.currentProfession)
          pmap.toggleLayerDisplay(pmap.currentDisplay)
        })
      );
  });
  //$('#sidebar_Model').click();
  //pmap.displayLocations()
  pmap.toggleLayerDisplay(pmap.currentDisplay)
};

pmap.recolorCountries = function(profession) {
  pmap.clearOverlays();
  $.each(pmap.stats.countries, function(id, country) {
    var styles = countryLayer.getFeatureStyle(id);
    if (profession in country.professions) {
      counts = country.professions[profession];
      var percentage = counts.m / (counts.m + counts.f);
      var color = getColorForPercentage(Math.max(percentage, .1));
      // opacity should be less if less than 100 total people
      var opacity = Math.min(1, Math.max(.2, (counts.m + counts.f) / 100));

      styles['fillColor'] = color;
      styles['fillOpacity'] = opacity;
      styles['strokeColor'] = color;
      styles['strokeOpacity'] = .1;
    } else {
      styles['fillOpacity'] = 0;
      styles['strokeOpacity'] = .1;
      styles['strokeColor'] = '#111111';
    }
  });
 };

pmap.loadCountryData = function(response) {
  // set up stats for GME country feature data
  $.each(response.features, function(i, feature) {
    var props = feature.properties;
    pmap.stats.countries[props.gx_id] = {
      female: props.FEMALES,
      male: props.MALES,
      id: props.adm0_a3,
      professions: {},
      name: props.name};
      pmap.stats.lookups.countries[props.adm0_a3] = props.gx_id;
  });
  $.getJSON('gender_counts.json', {}, pmap.loadProfessions);
};

pmap.displayLayers = function() {
  countryLayer = new google.maps.visualization.DynamicMapsEngineLayer({
    layerId: pmap.countryLayer,
    map: pmap.map,
    suppressInfoWindows: true
  });
  countryLayer.addListener('mouseover', function(obj) {
    if (pmap.currentDisplay == 'countries') {
      var props = pmap.stats.countries[obj.featureId];
      pmap.displayHoverData('Country', props);
    }
  });
};

pmap.displayHoverData = function(layer, props) {
  var counts = props.professions[pmap.currentProfession];
  $('#status').html([props.name].join(', '));
  if (!counts) {return;}
  $('#status').append('<br><span id="f">' + counts.f + '</span>' + ' / ');
  $('#status').append('<span id="m">' + counts.m + '</span>');
};

pmap.getFeatureData = function(results) {
  pmap.setupStats(results);
  if (results.nextPageToken) {
    $.getJSON(pmap.getTableUrl(pmap.featureTable), {
      key: pmap.apiKey,
      version: 'published',
      maxResults: 1000,
      pageToken: results.nextPageToken
    }, pmap.getFeatureData);
  } else {
  var params = {
    key: pmap.apiKey,
    version: 'published',
    maxResults: 1000,
    select: 'adm0_a3,name,gx_id'
  };
  $.getJSON(pmap.getTableUrl(pmap.countryTable), params, pmap.loadCountryData);
  }
};

/**
 * Return a circle symbol with the given radius.
 * @param {Number} scale (radius) of the circle.
 * @return {google.maps.SymbolPath.CIRCLE} circle.
 */
pmap.getCircle = function(scale, color, opacity) {
  var circle = {
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: color,
    fillOpacity: opacity,
    scale: scale,
    strokeColor: 'white',
    strokeWeight: .3
  };
  return circle;
};

/**
 * Initialize or augment the global stats and lookups.
 * @param {Object=} results list of features from GME.
 */
pmap.setupStats = function(results) {
  pmap.stats = pmap.stats || {
    locations: {},
    countries: {},
    professions: {},
    lookups: {countries: {}}
  };
  if (!results) { return; }
  $.each(results.features, function(i, feature) {
    pmap.addStats(feature);
  });
};

/**
 * Update stats with values from an individual feature.
 * @param {Object} GME Feature with properties.
 */
pmap.addStats = function(feature) {
  var props = feature.properties;
  // Each birth location gets a count of male/female as well as professions.
  if (!pmap.stats.locations[props.birthloc]) {
    var coords = feature.geometry.coordinates;
    pmap.stats.locations[props.birthloc] = {
      count: 0,
      name: props.name,
      latLng: new google.maps.LatLng(coords[1], coords[0]),
      male: {'count': 0},
      female: {'count': 0},
      professions: {}
    };
  }
  var loc = pmap.stats.locations[props.birthloc];
  loc.count += parseInt(props.count);
  if (props.gender == 'male') {
    loc.male.count += parseInt(props.count);
  } else {
    loc.female.count += parseInt(props.count);
  }
};


/**
 * Remove all overlays from the map.
 */
pmap.clearOverlays = function() {
  $.each(pmap.currentOverlays, function(i, overlay) {
    overlay.setMap(null);
  });
  pmap.currentOverlays = [];
};

/**
 * Display circle icons for [city] locations
 * @param {string} profession - the current selected profession.
 */
pmap.displayLocations = function(profession) {
  // TODO(jlivni): no need to clear all overlays and then repush
  pmap.clearOverlays();
  pmap.recolorCountries('');

  $.each(pmap.stats.locations, function(i, location) {
    // circles are sized based on total population, or count of selected
    // profession.
    if (!profession) {
      var counts = {f: location.female.count, m: location.male.count};
    } else if (profession in location.professions) {
      var counts = location.professions[profession];
    } else {
      counts = {f: 0, m: 0}
    }
    var percentage = counts.m / (counts.m + counts.f);
    var color = getColorForPercentage(Math.max(percentage, .1));
    var opacity = .8
    var size = Math.sqrt(counts.m + counts.f);
    if (size) { size += 3; }
    var overlay = new google.maps.Marker({
      icon: pmap.getCircle(size, color, opacity),
      position: location.latLng,
      map: pmap.map
    });
    overlay.name = i,
    overlay.properties = location;
    // add hover event for circle
     google.maps.event.addListener(overlay, 'mouseover', function() {
      var props = pmap.stats.locations[overlay.name];
      pmap.displayHoverData('Country', props);
    });
    pmap.currentOverlays.push(overlay);
  });
};

/**
 * Display a legend.
 */
pmap.addLegend = function() {
  $.each([.1, .2, .3, .4, .5, .6, .7, .8, .9, .99], function(i, percentage) {
    var color = getColorForPercentage(percentage);
    var li = $('<li/>');
    var span = $('<span/>');
    span.css('background', color);
    span.appendTo(li);
    li.appendTo($('.legend-labels'));
  });
};

google.maps.event.addDomListener(window, 'load', pmap.initialize);
