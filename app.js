// imports

var fs = require('fs'),
    irc = require('./irc'),
    sys = require('sys'),
    http = require('http'),
    path = require('path'),
    redis = require('redis'),
    _ = require('underscore'),
    sio = require('socket.io'),
    express = require('express');

// get the configuration

var configPath = path.join(__dirname, "config.json");
var config = JSON.parse(fs.readFileSync(configPath));
var app = module.exports = express.createServer();
var requestCount = 0;
var sockets = [];

// get the wikipedia shortnames sorted by their longname

var wikisSorted = [];
for (var chan in config.wikipedias) wikisSorted.push(chan);
wikisSorted.sort(function (a, b) {
  w1 = config.wikipedias[a].long;
  w2 = config.wikipedias[b].long;
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
    wikis: config.wikipedias,
    wikisSorted: wikisSorted,
    stream: true,
    trends: false
  });
});

app.get('/commons-image/:page', function (req, res){
  var path = "/w/api.php?action=query&titles=" + 
             encodeURIComponent(req.params.page) + 
             "&prop=imageinfo&iiprop=url|size&format=json";
  var opts = {
    headers: {'User-Agent': 'wikistream'},
    host: 'commons.wikimedia.org',
    path: path
  };
  http.get(opts, function (response) {
    //res.header('Content-Type', 'application/json');
    response.on('data', function (chunk) {
      res.setHeader('Cache-Control', 'public, max-age=1000')
      res.write(chunk);
    });
    response.on('end', function () {
      res.end();
    });
  });
});

app.get('/trends/', function (req, res){
  res.render('trends', {
    title: 'wikistream daily trends',
    stream: false,
    trends: true
  });
});

app.get('/about/', function (req, res){
  res.render('about', {
    title: 'about wikistream',
    stream: false,
    trends: false
  });
});

// TODO: might be able to create one stats view that does all these?

stats = redis.createClient(),

app.get('/stats/users-daily.json', function (req, res){
  stats.zrevrange(['users-daily', 0, 99, 'withscores'], function (e, r) {
    res.send(zresults(r));
  });
});

app.get('/stats/articles-daily.json', function (req, res){
  stats.zrevrange(['articles-daily', 0, 99, 'withscores'], function (e, r) {
    res.send(zresults(r));
  });
});

app.get('/stats/articles-hourly.json', function (req, res){
  stats.zrevrange(['articles-hourly', 0, 99, 'withscores'], function (e, r) {
    res.send(zresults(r));
  });
});

app.get('/stats/robots-daily.json', function (req, res){
  stats.zrevrange(['robots-daily', 0, 99, 'withscores'], function (e, r) {
    res.send(zresults(r));
  });
});

app.listen(config.port);


// set up socket.io to stream the irc updates

function sendUpdate(message) {
  _.each(sockets, function (socket) {
    socket.emit('message', message);
  });
}

var updateStream = irc.listen(config, sendUpdate);
var io = sio.listen(app);

io.configure('production', function () {
  io.set('log level', 2);
});

io.set('transports', config.transports);

io.sockets.on('connection', function (socket) {
  sockets.push(socket);
  console.log("adding a socket, now " + sockets.length + ' total');
  socket.on('disconnect', function () {
    sockets = _.without(sockets, socket);
    console.log("removing a socket, now " + sockets.length + ' total');
  });
});

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
