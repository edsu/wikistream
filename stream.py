#!/usr/bin/env python

"""
In this module you'll find a function wikipedia_updates which takes a callback 
function which will be passed wikipedia updates that stream from the socket.io
server at http://wikistream.inkdroid.org 

Each update will be passed to your callback function will be a Python dictionary 
that looks something like: 

{
  'anonymous': False,
  'comment': '/* Anatomy */  changed statement that orbit was the eye to saying
that the orbit was the eye socket for accuracy',
  'delta': 7,
  'flag': '',
  'namespace': 'article',
  'newPage': False,
  'page': 'Optic nerve',
  'pageUrl': 'http://en.wikipedia.org/wiki/Optic_nerve',
  'robot': False,
  'unpatrolled': False,
  'url': 'http://en.wikipedia.org/w/index.php?diff=449570600&oldid=447889877',
  'user': 'Moearly',
  'userUrl': 'http://en.wikipedia.org/wiki/User:Moearly',
  'wikipedia': '#en.wikipedia',
  'wikipediaLong': 'English Wikipedia',
  'wikipediaShort': 'en',
  'wikipediaUrl': 'http://en.wikipedia.org'
}

You'll need the requests (http://pypi.python.org/pypi/requests) library installed 
for the HTTP requests.

More about the protocol that socket.io uses can be found at:
https://github.com/learnboost/socket.io-spec
"""

import re
import json
import time

from requests import post, get

def wikipedia_updates(callback):
    endpoint = "http://wikistream.inkdroid.org/socket.io/1"
    endpoint = "http://localhost:3000/socket.io/1"
    session_id = post(endpoint).content.split(':')[0]
    xhr_endpoint = "/".join((endpoint, "xhr-polling", session_id))

    while True:
        t = time.time() * 1000000
        response = get(xhr_endpoint, params={'t': t}).content.decode('utf-8')

        chunks = re.split(u'\ufffd[0-9]+\ufffd', response)
        for chunk in chunks:
            parts = chunk.split(':', 3)
            if len(parts) == 4:
                callback(json.loads(parts[3]))


if __name__ == "__main__":
    def print_page(update): 
        print update

    wikipedia_updates(print_page)
