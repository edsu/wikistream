var fs = require('fs'),
    irc = require('irc-js'),
    redis = require('redis');

// get configuration

config = JSON.parse(fs.readFileSync('config.json'))

var client = new irc({
    server: 'irc.wikimedia.org',
    nick: config.ircNick,
    log: config.log,
    user: {
        username: config.ircUserName,
        realname: config.ircRealName
    }
})

// parse the mirc colored irc message

function parse_msg(msg) {
    m = /\x0314\[\[\x0307(.+?)\x0314\]\]\x034 (.*?)\x0310.*\x0302(http.+?)\x03.+\x0303(.+?)\x03.+\x03 (.+) \x0310(.+)\x03/.exec(msg[1]);
    if (! m) { return null; } 

    lang = /\#(.+)\.wikipedia/.exec(msg[0])[1];
    delta = parseInt(/([+-]\d+)/.exec(m[5])[1]);

    return {page: m[1], 
            flag: m[2], 
            url: m[3], 
            user: m[4], 
            delta: delta,
            comment: m[6],
            lang: lang}
}


// publish wikipedia activity to redis

db = redis.createClient();
client.connect(function () {
    client.join(config.channels);
    client.on("privmsg", function (msg) {
        m = parse_msg(msg.params);
        if (m) {
            db.publish("wikipedia", JSON.stringify(m));
            console.log(m.page);
        }
    });
});
