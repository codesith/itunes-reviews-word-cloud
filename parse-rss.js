var config = require('config');
var rest = require('restler');
var fs  = require("fs");

var rssBaseURL = config.get('rssBaseURL');
var app = config.get('app');
var maxPage = config.get('maxPage');

console.log("app is %s", app);
if (!app) {
  process.exit(1);
}

var url = rssBaseURL + "page=1/id=" + app + "/sortBy=mostRecent/json";
var page = 1;
getReviews();

function getReviews() {
  console.log("Page %d: %s", page, url);
  rest.get(url).on('success', function(result) {
    data = JSON.parse(result);
    //console.dir(data, {depth:null});
    entries = data.feed.entry;
    count = entries.length;
    // skip the first one since it's just a display for this app
    for(i = 1; i < count; i++) {
      entry = entries[i];
      text = cleanUp(entry.title.label + " " + entry.content.label);
      if (page ==1) {
        fs.writeFileSync(app+".txt", text + "\n");
      } else {
        fs.appendFileSync(app+".txt", text + "\n");
      }
      if (page < maxPage) {
        page++;
        url = rssBaseURL + "page="+page+"/id=" + app + "/sortBy=mostRecent/json";
        getReviews();
      }
    }
  });
}

function cleanUp(text) {
  return text.toUpperCase().replace(/nordstrom|app/gi, "")
}
