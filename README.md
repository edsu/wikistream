Wikistream is a Node.js webapp for helping visualize current editing
activity in Wikipedia. It uses Node.js, socket.io and Redis to sit in the
wikimedia IRC chat rooms (where updates are published), and makes them available
on the Web in realtime. Redis is used to keep tallies of various things 
for the hourly and daily trends reporting.

Installation
------------

These instructions assume you have Ubuntu. If you don't you'll need to figure
out the equivalent instructions. It shouldn't be too complicated. 

First, you need to get redis and nodejs, and nodejs dependencies

    sudo apt-get install redis-server nodejs npm
    npm install

Next you''ll want to use and/or adjust the default configuration:

    cp conf/config.json.example config.json
    
You may want to adjust the ircNick that is in the example to something unique,
so that you will be able to join the channels without a collision. Also you 
can adjust the wikipedia language channels that are being monitored.

Then, start the webapp;

    node app.js

wait 10-15 seconds for the app to join the irc channels, and then
point your browser at:

    http://localhost:3000/

For production deployments an upstart script and varnish config are included, 
which you should be able to install and use.

    sudo cp conf/wikistream.conf /etc/init/wikistream.conf
    sudo apt-get install varnish
    sudo cp conf/default.vcl /etc/varnish/
    sudo start wikistream

The icons were created by Delphine Ménard, and are separately available at:

* http://commons.wikimedia.org/wiki/File:Unisex_user_icon.svg
* http://commons.wikimedia.org/wiki/File:Icon_robot.svg
* http://commons.wikimedia.org/wiki/File:Icon_anon.svg

Authors
-------

* Ed Summers (http://twitter.com/edsu)
* Sean Hannan (http://twitter.com/mrdys)
* Delphine Ménard (http://twitter.com/notafish)

License
-------

* CC0
