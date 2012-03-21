wikistream is a Node webapp for helping visualize current editing
activity in wikipedia. It uses node.js, socket.io and redis to sit in the
wikimedia IRC chat rooms (where updates are published), and makes them available
on the Web in realtime.

Installation:

* install [redis](http://redis.io)
* install [node](http://node.io)
* install [npm](http://npmjs.org/)
* npm install

Next you''ll want to use and/or adjust the default configuration:

    cp config.json.example config.json

You may want to adjust the ircNick that is in the example to something unique,
so that you will be able to join the channels without a collision. Also you 
can adjust the wkipedia language channels that are being monitored.

Then, start the webapp;

    node app.js

wait 10-15 seconds for the app to join the irc channels, and then
point your browser at:

    http://localhost:3000/

An Upstart script is included, which you should be able to install and use. Just
make sure that you edit it so that they really point at where you have
installed node and checked out the wikistream code.

    cp wikistream.conf /etc/init/wikistream.conf
    start wikistream

The icons were created by Delphine Ménard, and are separately available at:

* http://commons.wikimedia.org/wiki/File:Unisex_user_icon.svg
* http://commons.wikimedia.org/wiki/File:Icon_robot.svg
* http://commons.wikimedia.org/wiki/File:Icon_anon.svg

Authors: 

* Ed Summers (http://twitter.com/edsu)
* Sean Hannan (http://twitter.com/mrdys)
* Delphine Ménard (http://twitter.com/notafish)

License: Public Domain
