// imports

var sys = require('sys'),
    redis = require('redis'),
    io = require('socket.io'),
    express = require('express');


// set up the webapp

var app = module.exports = express.createServer();
var requestCount = 0;

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
    title: 'wikistream'
  });
  console.log(requestCount + " - " + 
              req.headers["x-forwarded-for"] + " - " + 
              req.headers["user-agent"]);
});

app.setMaxListeners(300);
app.listen(3000);


// set up the update stream

var socket = io.listen(app);
var wikipedia = redis.createClient();
var listenerCount = 0;

socket.on('connect', function(client) {
    listenerCount += 1;
    console.log(listenerCount + " - connect - " + client);
    client.on('disconnect', function () {
        listenerCount -= 1;
        console.log(listenerCount + " - disconnect - " + client);
    });
});

wikipedia.subscribe('wikipedia');
wikipedia.on("message", function (channel, message) {
    socket.broadcast(message);
});
