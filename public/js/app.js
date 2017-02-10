$(document).ready(init);

var pause = false;
var deltaLimit = 0;
var wikipediaLimit = "all";
var namespaceLimit = "all";
var includeRobots = true;
var includeUsers = true;
var includeAnonymous = true;
var backgroundTimeout = 1000 * 7;
var showBackground = true;
var fetchingBackground = false;
var lastBackgroundChange = new Date() - backgroundTimeout;

function init() {
  setupControls();
  var numUpdates = getNumUpdates();
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
    removeOld(numUpdates);

  });

  $(window).resize(function() {
    numUpdates = getNumUpdates();
  });
}

function getNumUpdates() {
  var panelHeight = $(window).height() - $('#updatePanel').offset().top + 50;
  $('#updatePanel').height(panelHeight);
  numUpdates = Math.floor(panelHeight / 25);
  console.log('keep track of ' + numUpdates + ' updates');
  return numUpdates;
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
        var title = imageInfo['query']['pages'][pageId]['title'];
        var image = imageInfo['query']['pages'][pageId]['imageinfo'][0];
        if (image && image['width'] > 800 && image['height'] > 800 &&
            image['width'] < 3500 && image['height'] < 3500) {
          console.log('found suitable image with dimensions: ' + image['width'] + ' x ' + image['height']);
          // change the background image
          $.backstretch(image['url'], {speed: 1000}, function() {
            lastBackgroundChange = new Date();
            fetchingBackground = false;
          });
          // also update the image attribution information
          $("#backgroundInfo").fadeOut(function() {
            $("#backgroundInfo").empty();
            $("#backgroundInfo").append(
              $("<a>").attr({"href": image.descriptionurl}).text(title), 
              "<br> by ",
              $("<a>").attr({"href": "http://commons.wikimedia.org/wiki/User:" + image.user}).text(image.user)
            );
            $("#backgroundInfo").fadeIn();
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

function removeOld(numUpdates) {
  $('.update').slice(numUpdates).detach();
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
    href: msg.userUrl,
    target: '_new',
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
    $.bbq.pushState({wiki: wikipediaLimit.replace("#", "")});
  });

  /* don't display changing backgrounds on mobile devices */
  if (isMobile()) {
    $('input[name="background"]').attr('checked', false);
    showBackground = false;
  }

  $('input[type="checkbox"]').change(function() {
    var name = $(this).attr("name");
    var checked = $(this).is(":checked");

    console.log(name + ": " + checked);

    if (name == "user") {
      includeUsers = checked;
    } else if (name == "robot") {
      includeRobots = checked;
    } else if (name == "anonymous") {
      includeAnonymous = checked;
    } else if (name == "background") {
      showBackground = checked; 
    }
    var state = {};
    state[name] = checked;
    $.bbq.pushState(state, checked)
  });
  $('select[name="namespace"]').change(function() {
    namespaceLimit = ($('select[name="namespace"]').val());
    $.bbq.pushState({namespace: $('select[name="namespace"]').val()});
  });
  $(document).bind('keyup', 'p', togglePause);
  $(document).bind('keyup', 'pause', togglePause);

  // see if hash frag determines some of the control settings
  if ($.bbq.getState("wiki")) {
    $('select[name="wikis"]')
        .val("#" + $.bbq.getState("wiki"))
        .change();
  }
  if ($.bbq.getState("namespace")) {
    $('select[name="namespace"]')
      .val($.bbq.getState("namespace"))
      .change();
  }
  if ($.bbq.getState("robot") == "false") {
    $('input[name="robot"]').prop('checked', false).change();;
  }
  if ($.bbq.getState("anonymous") == "false") {
    $('input[name="anonymous"]').prop('checked', false).change();;
  }
  if ($.bbq.getState("user") == "false") {
    $('input[name="user"]').prop('checked', false).change();;
  }
}

function wikipediaFilter(msg) {
  if (wikipediaLimit == "all") return true;
  if (wikipediaLimit == msg.channel) return true;
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

function isMobile() {
  return screen.width <= 480;
}
