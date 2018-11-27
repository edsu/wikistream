// imports

var fs = require('fs'),
    http = require('https'),
    path = require('path'),
    _ = require('underscore'),
    sio = require('socket.io'),
    express = require('express'),
    wikichanges = require('wikichanges');

// get the configuration

var configPath = path.join(__dirname, "config.json");
var config = JSON.parse(fs.readFileSync(configPath));
var app = module.exports = express.createServer();
var requestCount = 0;

// get the wikipedia shortnames sorted by their longname

var wikisSorted = [];
for (var chan in wikichanges.wikipedias) wikisSorted.push(chan);
wikisSorted.sort(function (a, b) {
  w1 = wikichanges.wikipedias[a].long;
  w2 = wikichanges.wikipedias[b].long;
  if (w1 == w2) return 0;
  else if (w1 < w2) return -1;
  else if (w1 > w2) return 1;
});

// set up the web app

app.configure(function () {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(redirectOldPort);
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
});

app.configure('development', function () {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
  app.use(express.static(__dirname + '/public'));
});

app.configure('production', function () {
  app.use(express.errorHandler()); 
  app.use(express.static(__dirname + '/public', {maxAge: 60*15*1000}));
});

app.get('/', function (req, res){
  res.render('index', {
    title: 'wikistream',
    wikis: wikichanges.wikipedias,
    wikisSorted: wikisSorted,
    stream: true
  });
});

app.get('/commons-image/:page', function (req, res){
  var path = "/w/api.php?action=query&titles=" + 
             encodeURIComponent(req.params.page) + 
             "&prop=imageinfo&iiprop=url|size|comment|user&format=json";
  var opts = {
    headers: {'User-Agent': 'wikistream'},
    host: 'commons.wikimedia.org',
    path: path
  };
  http.get(opts, function (response) {
    response.on('data', function (chunk) {
      res.write(chunk);
    });
    response.on('end', function () {
      res.end();
    });
  });
});

app.get('/about/', function (req, res){
  res.render('about', {
    title: 'about wikistream',
    stream: false,
    trends: false
  });
});

app.listen(config.port);

// set up socket.io to stream the irc updates

var io = sio.listen(app);

var changes = new wikichanges.WikiChanges({ircNickname: config.ircNickname});
changes.listen(function(message) {
  io.sockets.emit('message', message);
  io.set('log level', 0);
});

io.configure('production', function () {
  io.set('log level', 2);
});

// some proxy environments might not support all socketio's transports

io.set('transports', config.transports);

/* this is only really needed on inkdroid.org where wikistream was initially
 * deployed to inkdroid.org:3000 and cited there, which resulted
 * in google using inkdroid.org:3000 as the canonical URL for wikistream
 * this bit of middleware will permanently redirect :3000 requests that 
 * bypass the proxy to wikistream.inkdroid.org. Hopefully Google will 
 * update their index :-)
 */

function redirectOldPort(req, res, next) {
  if (req.header('host') == 'inkdroid.org:3000' 
          && ! req.header('x-forwarded-for')) {
    res.redirect('http://wikistream.inkdroid.org' + req.url, 301);
  } else {
    next();
  }
}
