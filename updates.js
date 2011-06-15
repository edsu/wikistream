var irc = require('irc-js'),
    redis = require('redis');

// connect to the wikipedia updates irc channel

chans = ["#en.wikipedia", "#fr.wikipedia", "#es.wikipedia", 
         "#de.wikipedia", "#fi.wikipedia", "#ru.wikipedia",
         "#it.wikipedia", "#pt.wikipedia", "#nl.wikipedia",
         "#pl.wikipedia", "#ja.wikipedia"];

var client = new irc({
    server: 'irc.wikimedia.org',
    nick: 'wikistream',
    log: false,
    user: {
        username: 'wikistream-bot',
        realname: 'http://github.com/edsu/wikistream',
    }
})

// parse the mirc colored irc message

function parse_msg(msg) {
    m = /\x0314\[\[\x0307(.+?)\x0314\]\].+\x0302(http.+?)\x03.+\x0303(.+?)\x03.+\x0310(.+)\x03/.exec(msg[1]);
    if (! m) { return null; } 
    lang = /\#(.+)\.wikipedia/.exec(msg[0])[1];
    return {page: m[1], 
            url: m[2], 
            user: m[3], 
            comment: m[4],
            lang: lang}
}


// publish wikipedia activity to redis

db = redis.createClient();
client.connect(function () {
    client.join(chans);
    client.on("privmsg", function (msg) {
        m = parse_msg(msg.params);
        if (m) {
            db.publish("wikipedia", JSON.stringify(m));
            console.log(m.page);
        }
    });
});
