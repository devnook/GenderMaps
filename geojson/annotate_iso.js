var fs = require('fs')
var countries_file = 'country_iso.csv';

var loadCountries = function() {
  fs.readFile(countries_file, 'utf8', function(err, data) {
  if (err) throw err;
  console.log('OK: ' + countries_file);
  console.log(data.split('\n'))
  var lines = data.split('\n');
  var countries = {};

  for (var i = 1, line; line = lines[i]; i++) {
    var lineParts = line.split(',')
    countries[lineParts[2]] = [lineParts[4], lineParts[5]];
  }



  //var countries = JSON.parse(data);
  console.log(countries)
  fs.writeFile("countries_iso.json", JSON.stringify(countries), function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log("The file was saved!");
        }
    });




  //annotateProfessions(countries);

});
}

var gender_file = 'gender_counts.json';

var countryCodeCol = 2;
var professionsCol = 8;

var countryStats = {};

var annotateProfessions = function(countries) {
  fs.readFile(gender_file, 'utf8', function(err, data) {
    if (err) throw err;
    console.log('OK: ' + countries_file);
    //console.log(data)

    var locations = JSON.parse(data);
    console.log(locations)

    for (var i = 0, location; location = locations[i]; i++) {
      console.log(location[countryCodeCol]);
      console.log(location);

      if (!countryStats[location[countryCodeCol]]) {
        countryStats[location[countryCodeCol]] = location[professionsCol];
      } else {
        for (var profession in location[professionsCol]) {
          var counts = location[professionsCol][profession];
          counts['m'] = counts['m'] || 0;
          counts['f'] = counts['f'] || 0;

          if (countryStats[location[countryCodeCol]][profession]) {
            countryStats[location[countryCodeCol]][profession]['m'] += counts['m'];
            countryStats[location[countryCodeCol]][profession]['f'] += counts['f'];
          } else {
            countryStats[location[countryCodeCol]][profession] = counts;
          }
        };
      }
    }

    // Annotate
    for (var i = 0, country; country = countries.features[i]; i++) {
      country.properties.professions = countryStats[country.id];
    }

    console.log(JSON.stringify(countries));
    fs.writeFile("gender.geo.json", JSON.stringify(countries), function(err) {
        if(err) {
            console.log(err);
        } else {
            console.log("The file was saved!");
        }
    });


  });
};

loadCountries()