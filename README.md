wikistream is a barebones webapp for helping vvisualize current editing
activity in wikipedia. It uses node.js, socket.io and redis to sit in the
wikimedia IRC chat rooms (where updates are published), and makes them available
on the Web in realtime.

To run the app you'll need to fetch wikipedia updates from IRC and feed them
to redis:

    node updates.js

And then you'll need to start the webapp;

    node app.js

The point your browser at:

    http://localhost:3000/
