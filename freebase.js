/**
 * @fileoverview Combines aggregate data on genders/professions by location
 * TODO(ewag): Display hover effect for individual location circles
 * add toggle for switching to circles and countries
 * color circles by profession/gender
 */


// Don't display profession with less than this many results [people].
var MIN_MATCHES = 1300; // ~30 professions with >1500 results

var genderMap = {
  map: null,
  currentProfession: 'Singer', // default
  currentDisplay: 'countries',
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
 * Initializes the map, sets up base click listeners.
 */
genderMap.initialize = function() {
  map = new google.maps.Map(document.getElementById('map-canvas'), {
    zoom: 2,
    disableDefaultUI: true,
    center: new google.maps.LatLng(25.8, -20.3),
  });

  var controls = map.controls;
  controls[google.maps.ControlPosition.TOP_RIGHT].push($('#legend')[0]);
  controls[google.maps.ControlPosition.RIGHT_TOP].push($('#status')[0]);
  controls[google.maps.ControlPosition.TOP_LEFT].push($('#selection')[0]);
  controls[google.maps.ControlPosition.TOP_CENTER].push($('#layer-toggle')[0]);

  genderMap.addLegend();
  genderMap.addSidebar();


  // Load a GeoJSON from the same server as our demo.
  map.data.loadGeoJson('gender.geo.json');

  map.data.addListener('mouseover', function(e) {
    $('#status').html('');
    var name = e.feature.getProperty('name')
    $('#status').html(name);
    if (e.feature.getProperty('professions')) {
      var counts = e.feature.getProperty('professions')[genderMap.currentProfession];
      if (!counts) {
        return;
      }
      counts.f = counts.f || 0;
      counts.m = counts.m || 0;
      $('#status').append('<br><span id="f">' + counts.f + '</span>' + ' / ');
      $('#status').append('<span id="m">' + counts.m + '</span>');
    }
  });

  genderMap.showProfession(genderMap.currentProfession);
};


genderMap.showProfession = function(professionName) {
  map.data.setStyle(function(feature) {
    var color = '#fff';
    var opacity = .5;
    if (feature.getProperty('professions') && feature.getProperty('professions')[professionName]) {
      var profession = feature.getProperty('professions')[professionName];
      var percentage = profession.m / (profession.m + profession.f);
      color = getColorForPercentage(percentage);
      opacity = Math.min(1, Math.max(.2, (profession.m + profession.f) / 100));
    }
    return {
      fillColor: color,
      strokeColor: color,
      strokeWeight: 2,
      fillOpacity: opacity,
      strokeOpacity: .1
    };
  });
};


genderMap.addSidebar = function() {
  $.get('professions.json', function(data) {
    $.each(data, function(i, profession) {
      console.log(profession)
      var percentage = profession.m / (profession.m + profession.f);
      var color = getColorForPercentage(percentage);
      $('#professions').append(
        $('<li></li>')
          .attr('value', profession.name)
          .attr('id', 'sidebar_' + profession.name)
          .text(profession.name)
          .css('color', color)
          .click(function() {
            $('#status').html('');
            $('.selected').removeClass('selected');
            $(this).addClass('selected');
            genderMap.currentProfession = $(this).text();
            genderMap.showProfession(genderMap.currentProfession);
          })
      );
    });
  });
};


genderMap.addLegend = function() {
  $.each([.1, .2, .3, .4, .5, .6, .7, .8, .9, .99], function(i, percentage) {
    var color = getColorForPercentage(percentage);
    var li = $('<li/>');
    var span = $('<span/>');
    span.css('background', color);
    span.appendTo(li);
    li.appendTo($('.legend-labels'));
  });
};


google.maps.event.addDomListener(window, 'load', genderMap.initialize);
