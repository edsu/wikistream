// imports

var fs = require('fs'),
    sys = require('sys'),
    redis = require('redis'),
    sio = require('socket.io'),
    express = require('express');


// get the configuration

var config = JSON.parse(fs.readFileSync('config.json'));
var app = module.exports = express.createServer();
var requestCount = 0;
var wikisSorted = [];
for (var chan in config.wikipedias) wikisSorted.push(chan);
wikisSorted.sort();


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
