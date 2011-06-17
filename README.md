wikistream is a barebones webapp for helping visualize current editing
activity in wikipedia. It uses node.js, socket.io and redis to sit in the
wikimedia IRC chat rooms (where updates are published), and makes them available
on the Web in realtime.

Installation:

* install [redis](http://redis.io)
* install [node](http://node.io)
* install [npm](http://npmjs.org/)
* npm install

To run the app you'll first need to fetch wikipedia updates from IRC and 
feed them to redis:

    node updates.js

next, start the webapp;

    node app.js

and point your browser at:

    http://localhost:3000/

An upstart script is included, which you should be able to install and use:

    cp wikistream.conf /etc/init/wikistream.conf
    start wikistream

Author: Ed Summers (ehs@pobox.com)

License: Public Domain
