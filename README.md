Wikistream is a Node webapp for helping visualize current editing
activity in Wikipedia. The app sits in the wikimedia IRC chat rooms (where 
updates are published by the various Mediawiki instances), and makes them 
available on the Web in realtime.

The code for listening to the IRC update stream was split out into a separate 
Node module called [wikichanges](https://www.npmjs.org/package/wikichanges).

Installation
------------

These instructions assume you have Ubuntu. If you don't you'll need to figure
out the equivalent instructions. It shouldn't be too complicated. 

First, you need to get Node and dependencies:

    sudo apt-get install nodejs
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
