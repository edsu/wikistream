var fs = require('fs'),
    path = require('path'),
    irc = require('irc-js'),
    redis = require('redis').createClient(),
    statsStart = new Date();

function main() {
  configFile = path.join(__dirname, 'config.json');
  config = JSON.parse(fs.readFileSync(configFile))
  channels = [];
  for (var chan in config.wikipedias) { channels.push(chan); }

  var client = new irc({
    server: 'irc.wikimedia.org',
    nick: config.ircNick,
    log: config.log,
    user: {
      username: config.ircUserName,
      realname: config.ircRealName
    }
  })

  client.connect(function () {
    client.join(channels);
    client.on('privmsg', processMessage);
  });

  setStatsTimeout();  
}

function parse_msg (msg) {
  // i guess this means i have two problems now? :-D
  var m = /\x0314\[\[\x0307(.+?)\x0314\]\]\x034 (.*?)\x0310.*\x0302(http.+?)\x03.+\x0303(.+?)\x03.+\x03 (.+) \x0310(.+)\x03/.exec(msg[1]);
  if (! m) { return null; } 

  // convert change in characters to a (possibly negative) integer
  var delta = parseInt(/([+-]\d+)/.exec(m[5])[1]);

  // see if it looks like an anonymous edit
  var user = m[4];
  var anonymous = user.match(/\d+.\d+.\d+.\d+/) ? true : false;

  // unpack the flags
  var flag = m[2];
  var isRobot = flag.match(/B/) ? true : false;
  var isNewPage = flag.match(/N/) ? true : false;
  var isUnpatrolled = flag.match(/!/) ? true : false;

  // determine the url
  var page = m[1];
  var wikipedia = msg[0];
  var wikipediaUrl = 'http://' + wikipedia.replace('#', '') + '.org';
  var pageUrl = wikipediaUrl + '/wiki/' + page.replace(/ /g, '_');
  var userUrl = wikipediaUrl + '/wiki/User:' + user;
  
  return {
    flag: flag, 
    page: page, 
    pageUrl: pageUrl,
    url: m[3], 
    delta: delta,
    comment: m[6],
    wikipedia: wikipedia,
    wikipediaUrl: wikipediaUrl,
    wikipediaShort: config.wikipedias[msg[0]].short,
    wikipediaLong: config.wikipedias[msg[0]].long,
    user: user, 
    userUrl: userUrl,
    unpatrolled: isUnpatrolled,
    newPage: isNewPage,
    robot: isRobot,
    anonymous: anonymous
  }
}

function processMessage (msg) {
    m = parse_msg(msg.params);
    if (m) {
      redis.publish('wikipedia', JSON.stringify(m));
      stats(m);
      console.log(m.page);
    }
}

function stats (msg) {
  redis.zincrby('pages-daily', 1, JSON.stringify(
    {'page': msg.page, 'pageUrl': msg.pageUrl}));
  if (msg.robot) {
    redis.zincrby('robots-daily', 1, JSON.stringify(
    {user: msg.user, url: msg.userUrl}));
  } else {
    redis.zincrby('users-daily', 1, JSON.stringify(
      {user: msg.user, url: msg.userUrl}));
  }
}

function setStatsTimeout () {
  var t = new Date();
  var elapsed = t.getUTCHours() * 60 * 60 
                + t.getUTCMinutes() * 60 
                + t.getUTCSeconds();
  var remaining = 24 * 60 * 60 - elapsed;
  setTimeout(resetStats, remaining * 1000);
}

function resetStats () {
  console.log("resetting daily stats");
  redis.del('pages-daily');
  redis.del('robots-daily');
  redis.del('users-daily');
  setStatsTimeout();
}

main();
