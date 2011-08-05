// imports

var fs = require('fs'),
    sys = require('sys'),
    path = require('path'),
    sio = require('socket.io'),
    express = require('express'),
    stats = require('redis').createClient(),
    updates = require('redis').createClient();


// little helper to package up zrevrange redis query results

function zresults(resp) {
  results = []
  for (var i=0; i < resp.length; i+=2) {
    r = JSON.parse(resp[i]);
    r['score'] = resp[i+1];
    results.push(r)
  }
  return results;
}

// get the configuration

var configPath = path.join(__dirname, "config.json");
var config = JSON.parse(fs.readFileSync(configPath));
var app = module.exports = express.createServer();
var requestCount = 0;


// get the wikipedia shortnames sorted by their longname

var wikisSorted = [];
for (var chan in config.wikipedias) wikisSorted.push(chan);
wikisSorted.sort(function(a, b) {
  w1 = config.wikipedias[a].long;
  w2 = config.wikipedias[b].long;
  if (w1 == w2) return 0;
  else if (w1 < w2) return -1;
  else if (w1 > w2) return 1;
});


// set up the web app

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

/*
app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});
*/

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

app.get('/', function(req, res){
  res.render('index', {
    title: 'wikistream',
    wikis: config.wikipedias,
    wikisSorted: wikisSorted
  });
});

// TODO: might be able to create one stats view that does all these?

app.get('/stats/users-daily.json', function(req, res){
  stats.zrevrange(['users-daily', 0, 99, 'withscores'], function (e, r) {
    res.send(zresults(r));
  });
});

app.get('/stats/articles-daily.json', function(req, res){
  stats.zrevrange(['articles-daily', 0, 99, 'withscores'], function (e, r) {
    res.send(zresults(r));
  });
});

app.get('/stats/articles-hourly.json', function(req, res){
  stats.zrevrange(['articles-hourly', 0, 99, 'withscores'], function (e, r) {
    res.send(zresults(r));
  });
});

app.get('/stats/robots-daily.json', function(req, res){
  stats.zrevrange(['robots-daily', 0, 99, 'withscores'], function (e, r) {
    res.send(zresults(r));
  });
});

app.listen(3000);


// set up the socket.io update stream

var io = sio.listen(app);

updates.subscribe('wikipedia');

io.sockets.on('connection', function(socket) {
    updates.on("message", function (channel, message) {
        socket.send(message);
    });
});
