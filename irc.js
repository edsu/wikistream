var fs = require('fs'),
    path = require('path'),
    irc = require('irc-js'),
    redis = require('redis').createClient();

function listen(config, callback) {
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
    client.on('privmsg', function(msg) { 
      m = parse_msg(msg.params, config);
      if (m) {
        callback(m);
        stats(m);
      }
    });
    client.on('error', function(msg) {
      console.log("irc error: " + msg);
    });
  });

  setDailyStatsTimeout();  
  setHourlyStatsTimeout();
}

function parse_msg(msg, config) {
  // i guess this means i have two problems now? :-D
  var m = /\x0314\[\[\x0307(.+?)\x0314\]\]\x034 (.*?)\x0310.*\x0302(.*?)\x03.+\x0303(.+?)\x03.+\x03 (.*) \x0310(.*)\x03?.*/.exec(msg[1]);
  if (! m) { 
      console.log("failed to parse: " + msg);
      return null;
  } 

  // convert change in characters to a (possibly negative) integer
  if (m[5]) {
    var delta = parseInt(/([+-]\d+)/.exec(m[5])[1]);
  } else {
    var delta = null;
  }

  // see if it looks like an anonymous edit
  var user = m[4];
  var anonymous = user.match(/\d+.\d+.\d+.\d+/) ? true : false;

  // unpack the flags
  var flag = m[2];
  var isRobot = flag.match(/B/) ? true : false;
  var isNewPage = flag.match(/N/) ? true : false;
  var isUnpatrolled = flag.match(/!/) ? true : false;

  var page = m[1];
  var wikipedia = msg[0];
  var wikipediaUrl = 'http://' + wikipedia.replace('#', '') + '.org';
  var pageUrl = wikipediaUrl + '/wiki/' + page.replace(/ /g, '_');
  var userUrl = wikipediaUrl + '/wiki/User:' + user;
  var namespace = getNamespace(wikipedia, page, config);

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
    anonymous: anonymous,
    namespace: namespace
  }
}

function stats(msg) {
  dailyStats(msg);
  hourlyStats(msg);
  permStats(msg);
}

function dailyStats(msg) {
  redis.zincrby('wikipedias-daily', 1, msg.wikipedia);
  if (msg.namespace == "article") {
    redis.zincrby('articles-daily', 1, JSON.stringify(
      {name: msg.page, 'url': msg.pageUrl, 'wikipedia': msg.wikipediaShort}));
  }
  if (msg.robot) {
    redis.zincrby('robots-daily', 1, JSON.stringify(
      {name: msg.user, url: msg.userUrl, 'wikipedia': msg.wikipediaShort}));

  } else {
    redis.zincrby('users-daily', 1, JSON.stringify(
      {name: msg.user, url: msg.userUrl, 'wikipedia': msg.wikipediaShort}));
  }
}

function setDailyStatsTimeout() {
  var t = new Date();
  var elapsed = t.getUTCHours() * 60 * 60 
                + t.getUTCMinutes() * 60 
                + t.getUTCSeconds();
  var remaining = 24 * 60 * 60 - elapsed;
  setTimeout(resetDailyStats, remaining * 1000);
}

function resetDailyStats() {
  console.log("resetting daily stats");
  redis.del('articles-daily');
  redis.del('robots-daily');
  redis.del('users-daily');
  redis.del('wikipedias-daily');
  setDailyStatsTimeout();
}

function hourlyStats(msg) {
  if (msg.namespace == "article") {
    redis.zincrby('articles-hourly', 1, JSON.stringify(
      {name: msg.page, 'url': msg.pageUrl, 'wikipedia': msg.wikipediaShort}));
  }
}

function setHourlyStatsTimeout() {
  var t = new Date();
  var elapsed = t.getUTCMinutes() * 60 + t.getUTCSeconds();
  var remaining = 60 * 60 - elapsed;
  setTimeout(resetHourlyStats, remaining * 1000);
}

function resetHourlyStats() {
  console.log("resetting daily stats");
  redis.del('articles-hourly');
  setHourlyStatsTimeout();
}

function permStats(msg) {
  if (msg.robot) {
    redis.zincrby('robots', 1, msg.user);
  }
  if (msg.namespace != "article") {
    redis.zincrby('namespaces', 1, msg.namespace);
  }
}

function getNamespace(wikipedia, page, config) {
  ns = null;
  var parts = page.split(':');
  if (parts.length > 1 && parts[1][0] != " ") {
    ns = config['wikipedias'][wikipedia]['namespaces'][parts[0]];
    if (! ns) ns = "wikipedia";
  } else {
    ns = 'article';
  }
  return ns;
}

exports.listen = listen;
