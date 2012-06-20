$(document).ready(init);

var pause = false;
var deltaLimit = 0;
var wikipediaLimit = "all";
var namespaceLimit = "all";
var includeRobots = true;
var includeUsers = true;
var includeAnonymous = true;
var backgroundTimeout = 1000 * 10;
var showBackground = true;
var fetchingBackground = false;
var lastBackgroundChange = new Date() - backgroundTimeout;

function init() {
  setupControls();
  var socket = io.connect();
  socket.on('message', function(msg) {
    
    // apply filters
    if (pause) return;
    if (! wikipediaFilter(msg)) return;
    if (! userFilter(msg)) return;
    if (! namespaceFilter(msg)) return;
    if (Math.abs(msg.delta) < deltaLimit) return;

    // update the stream
    addUpdate(msg);
    removeOld();
  });
}

function addUpdate(msg) {
  var lang = $('<span>').attr({'class': 'lang'}).text('[' + msg.wikipediaShort + ']');
  var a = $('<a>').attr({'class': 'page', 'href': msg.url, 'title': msg.comment, target: '_new'}).text(msg.page);
  var delta;
  if (msg.delta == null) delta = "n/a";
  else if (msg.delta < 0) delta = msg.delta;
  else delta = "+" + msg.delta;
  delta = $('<span>').attr({'class': 'delta'}).text(delta);

  updateClasses = ['update'];
  if (msg.newPage) updateClasses.push('newPage');
  if (msg.unpatrolled) updateClasses.push('unpatrolled');

  var d = $('<div>').attr({'class': updateClasses.join(' ')})
    .append(userIcon(msg))
    .append(lang)
    .append(a)
    .append(delta)
    .hide();
  $('#updates').prepend(d);
  d.slideDown('medium');

  // update background with wikimedia commons image, but not too often
  if (msg.wikipediaShort 
    && showBackground
    && msg.page.match('File:') 
    && msg.page.match(/(png|jpg)$/i)
    && ! fetchingBackground
    && (new Date() - lastBackgroundChange > backgroundTimeout)) {
    var url = "/commons-image/" + encodeURIComponent(msg.page);
    fetchingBackground = true;
    console.log("fetching background image: " + url);
    $.getJSON(url, function(imageInfo) {
      for (pageId in imageInfo['query']['pages']) break;
      try {
        var image = imageInfo['query']['pages'][pageId]['imageinfo'][0];
        if (image && image['width'] > 500 && image['height'] > 500 &&
            image['width'] < 2500 && image['height'] < 2500) {
          console.log('found suitable image with dimensions: ' + image['width'] + ' x ' + image['height']);
          $.backstretch(image['url'], {speed: 1000}, function() {
            lastBackgroundChange = new Date();
            fetchingBackground = false;
          });
        } else {
          console.log("image not the right size: " + image['width'] + ' x ' + image['height'])
        }
      } catch(e) {
        console.log("error while fetching commons image " + url + " : " + e);
      } finally {
        fetchingBackground = false;
      }
    });
  }
}

function removeOld() {
  // remove the old stuff
  var old = $('.update').slice(30)
  old.fadeOut('fast', function() { old.detach(); });
}

function togglePause() {
  pause = ! pause;
  if (pause) {
    $('header').block({ 
      message: '<br/>Paused<br/>Press \'p\' to unpause', 
      css: {
        'border': 'none',
        'color': 'black',
        'opacity': '1',
        'width': '280px',
        'height': '70px'
      }
    });
  } else {
    $('header').unblock();
  }
}

function userIcon(msg) {
  // construct a link to the user profile
  wikipediaHost = msg.wikipedia.replace('#', '') + '.org'
  userLink= $("<a>").attr({
    'href': 'http://' + wikipediaHost + '/wiki/User:' + msg.user,
    'target': '_new',
  });

  var src = title = null;
  if (msg.robot) {
    src = '/images/robot.png';
    title = 'Bot: ';
  } else if (msg.anonymous) {
    src = '/images/question.png';
    title = 'Anonymous: ';
  } else {
    src = '/images/person.png';
    title = 'User: ';
  }
  return userLink.append($("<img>").attr({src: src, title: title + msg.user}));
}

function setupControls() {
  $('#slider').slider({
    range: 'min',
    value: 0,
    min: 0,
    max: 1000,
    step: 50,
    slide: function(event, ui) {
      deltaLimit = parseInt(ui.value);
      $('#deltaLimit').text(ui.value);
    }
  });

  $('select[name="wikis"]').change(function() {
    wikipediaLimit = ($('select[name="wikis"]').val());
  });

  $('input[type="checkbox"]').change(function() {
    var userType = $(this).attr("name");
    var checked = $(this).attr("checked");
    if (userType == "user") {
      includeUsers = checked;
    } else if (userType == "robot") {
      includeRobots = checked;
    } else if (userType == "anonymous") {
      includeAnonymous = checked;
    }
  });
  $('select[name="namespace"]').change(function() {
    namespaceLimit = ($('select[name="namespace"]').val());
  });
  $('input[name="background"]').change(function() {
    showBackground = ! showBackground;
    if (! showBackground) 
      $("body").css('background-image', '');
  });

  $(document).bind('keyup', 'p', togglePause);
  $(document).bind('keyup', 'pause', togglePause);
}

function wikipediaFilter(msg) {
  if (wikipediaLimit == "all") return true;
  if (wikipediaLimit == msg.wikipedia) return true;
  return false;
}

function namespaceFilter(msg) {
  if (namespaceLimit == "all") return true;
  if (namespaceLimit == msg.namespace) return true;
  return false;
}

function userFilter(msg) {
  if (! includeRobots && msg.robot) {
    return false;
  } else if (! includeAnonymous && msg.anonymous) {
    return false;
  } else if (! includeUsers && (! msg.anonymous && ! msg.robot)) {
    return false;
  }
  return true;
}
