// imports

var fs = require('fs'),
    sys = require('sys'),
    path = require('path'),
    redis = require('redis'),
    sio = require('socket.io'),
    express = require('express');


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

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

app.get('/', function(req, res){
  requestCount += 1;
  res.render('index', {
    title: 'wikistream',
    wikis: config.wikipedias,
    wikisSorted: wikisSorted
  });
  console.log(requestCount + " - " + 
              req.headers["x-forwarded-for"] + " - " + 
              req.headers["user-agent"]);
});

app.listen(3000);


// set up the socket.io update stream

var socket = sio.listen(app);
var wikipedia = redis.createClient();

wikipedia.subscribe('wikipedia');
wikipedia.on("message", function (channel, message) {
    socket.broadcast(message);
});
