var fs = require('fs'),
    path = require('path'),
    irc = require('irc-js'),
    redis = require('redis');


// function to parse the mirc colored irc message

function parse_msg(msg) {
  m = /\x0314\[\[\x0307(.+?)\x0314\]\]\x034 (.*?)\x0310.*\x0302(http.+?)\x03.+\x0303(.+?)\x03.+\x03 (.+) \x0310(.+)\x03/.exec(msg[1]);
  if (! m) { return null; } 

  // convert change in characters to a (possibly negative) integer
  delta = parseInt(/([+-]\d+)/.exec(m[5])[1]);

  // see if it looks like an anonymous edit
  user = m[4];
  anonymous = user.match(/\d+.\d+.\d+.\d+/) ? true : false;

  // unpack the flags
  flag = m[2];
  isRobot = flag.match(/B/) ? true : false;
  isNewPage = flag.match(/N/) ? true : false;
  isUnpatrolled = flag.match(/!/) ? true : false;

  return {
    page: m[1], 
    flag: flag, 
    url: m[3], 
    delta: delta,
    comment: m[6],
    wikipedia: msg[0],
    wikipediaShort: config.wikipedias[msg[0]].short,
    wikipediaLong: config.wikipedias[msg[0]].long,
    user: user, 
    unpatrolled: isUnpatrolled,
    newPage: isNewPage,
    robot: isRobot,
    anonymous: anonymous
  }
}


// get configuration

configFile = path.join(__dirname, 'config.json');
config = JSON.parse(fs.readFileSync(configFile))


// create the irc client

var client = new irc({
  server: 'irc.wikimedia.org',
  nick: config.ircNick,
  log: config.log,
  user: {
    username: config.ircUserName,
    realname: config.ircRealName
  }
})

channels = [];
for (var chan in config.wikipedias) { channels.push(chan); }


// join the channels and publish wikipedia activity to redis

db = redis.createClient();

client.connect(function () {
  client.join(channels);
  client.on("privmsg", function (msg) {
    m = parse_msg(msg.params);
    if (m) {
      db.zincrby("flag", 1, m.flag);
      db.publish("wikipedia", JSON.stringify(m));
      console.log(m);
    }
  });
});
