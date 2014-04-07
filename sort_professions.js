var fs = require('fs')
var countries_file = 'countries.geo.json';

var loadCountries = function() {
  fs.readFile(countries_file, 'utf8', function(err, data) {
  if (err) throw err;
  console.log('OK: ' + countries_file);
  //console.log(data)

  var countries = JSON.parse(data);
  console.log(countries)




  annotateProfessions(countries);

});
}

var gender_file = 'gender_counts.json';

var countryCodeCol = 2;
var professionsCol = 8;

var professionStats = {};
var professionsOrdered = [];
var MIN_MATCHES = 1300;

var annotateProfessions = function(countries) {
  fs.readFile(gender_file, 'utf8', function(err, data) {
    if (err) throw err;
    console.log('OK: ' + gender_file);
    //console.log(data)

    var locations = JSON.parse(data);
    console.log(locations)

    for (var i = 0, location; location = locations[i]; i++) {
      for (var profession in location[professionsCol]) {
        var counts = location[professionsCol][profession];
        counts['m'] = counts['m'] || 0;
        counts['f'] = counts['f'] || 0;

        if (professionStats[profession]) {
          professionStats[profession]['m'] += counts['m'];
          professionStats[profession]['f'] += counts['f'];
        } else {
          professionStats[profession] = counts;
        }
      };
    }

    for (var profession in professionStats) {
      var stats = professionStats[profession];
      if (stats.f + stats.m > MIN_MATCHES) {
        stats.name = profession;
        professionsOrdered.push(stats);
      }
    }

    professionsOrdered.sort(function(a, b) {
      return (((b.f || 1) / (b.m || 1)) - ((a.f || 1) / (a.m) || 1));
    });


    console.log(professionsOrdered)

    // Annotate

    //console.log(JSON.stringify(countries));
    fs.writeFile("professions.json", JSON.stringify(professionsOrdered), function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log("The file was saved!");
        }
    });


  });
};

loadCountries()