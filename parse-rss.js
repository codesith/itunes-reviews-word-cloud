var config = require('config');
var rest = require('restler');
var fs  = require("fs");
var dateformat = require("dateformat");
var jsonfile = require("jsonfile");

var rssBaseURL = config.get('rssBaseURL');
var apps = config.get('apps');
var maxPage = config.get('maxPage');
var now = new Date()
var timestamp = dateformat(now, "yyyy-mm-dd");
console.log(timestamp);

for (var i = 0; i < apps.length; i++){
  cleanFile("logs/"+apps[i].id+"-all-"+timestamp+".txt");
  cleanFile("logs/"+apps[i].id+"-negative-"+timestamp+".txt");
  cleanFile("logs/"+apps[i].id+"-positive-"+timestamp+".txt");
  apps[i].page = 1;
  ignoresReg = new RegExp(apps[i].ignores, "gi");
  console.log(ignoresReg);
  apps[i].ignoresReg = ignoresReg;
  apps[i].stats = {"ratings":[0,0,0,0,0,0]};
  getReviews(apps[i]);
}

function getReviews(app) {
  var url = rssBaseURL + "page=" + app.page + "/id=" + app.id + "/sortBy=mostRecent/json";
  console.log("%s(%d), page %d: %s", app.name, app.id, app.page, url);
  rest.get(url).on('success', function(result) {
    data = JSON.parse(result);
    //console.dir(data, {depth:null});
    entries = data.feed.entry;
    if (undefined == entries) {
      printStats(app);
      return;
    }
    count = entries.length;
    // skip the first one since it's just a display for this app
    for(var j = 1; j < count; j++) {
      entry = entries[j];
      text = (entry.title.label + " " + entry.content.label).replace(app.ignoresReg, "").toUpperCase();
      rating = entry['im:rating'].label;
      printText(app, text, rating);
      app.stats.ratings[rating]++;
      if (app.page < maxPage) {
        app.page++;
        getReviews(app);
      } else {
        printStats(app);
      }
    }
  });
}

function cleanFile(file) {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
  }
}

function printStats(app) {
  jsonfile.writeFile("logs/"+app.id+"-"+timestamp+".stats", app.stats, {spaces: 2});
}

function printText(app, text, rating) {
  allReviews = "logs/"+app.id+"-all-"+timestamp+".txt";
  fs.appendFileSync(allReviews, text + "\n");
  if (rating < 3) {
    reviews = "logs/"+app.id+"-negative-"+timestamp+".txt";
  } else {
    reviews = "logs/"+app.id+"-positive-"+timestamp+".txt";
  }
  fs.appendFileSync(reviews, text + "\n");
}
