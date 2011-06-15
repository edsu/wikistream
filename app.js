// imports

var sys = require('sys'),
    redis = require('redis'),
    io = require('socket.io'),
    express = require('express'),
    spawn = require('child_process').spawn;


// set up the webapp

var app = module.exports = express.createServer();

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
  res.render('index', {
    title: 'seachstream'
  });
});

app.listen(3000);


// set up the update stream

var socket = io.listen(app);
socket.on('connect', function(client) {
    console.log(client);
});

var wikipedia = redis.createClient();
wikipedia.subscribe('wikipedia');
wikipedia.on("message", function (channel, message) {
    socket.broadcast(message);
    console.log("channel: " + channel + " ; message: " + message);
});
