var irc = require('irc-js'),
    redis = require('redis');

// connect to the wikipedia updates irc channel

var client = new irc({
    server: 'irc.wikimedia.org',
    nick: 'wikistream',
    log: true,
    user: {
        username: 'wikistream-bot',
        realname: 'http://github.com/edsu/wikistream',
    }
})

// parse the mirc colored irc message

function parse_msg(s) {
    m = /\x0314\[\[\x0307(.+?)\x0314\]\].+\x0302(http.+?)\x03.+\x0303(.+?)\x03.+\x0310(.+)\x03/.exec(s);
    if (! m) { return null; } 
    else {return {page: m[1], url: m[2], user: m[3], comment: m[4]}}
}


// publish wikipedia activity to redis

db = redis.createClient();
client.connect(function () {
    client.join("#en.wikipedia");
    client.on("privmsg", function (msg) {
        m = parse_msg(msg.params[1]);
        if (m) {
            db.publish("wikipedia", JSON.stringify(m));
            console.log(msg);
            console.log(m);
        }
    });
});
