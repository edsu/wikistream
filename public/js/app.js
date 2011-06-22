$(document).ready(init);

var pause = false;
var deltaLimit = 0;
var wikipediaLimit = "all";
var includeRobots = true;
var includeUsers = true;
var includeAnonymous = true;

function init() {
  var socket = new io.Socket();
  socket.connect();

  socket.on('message', function(data) {
    var msg = jQuery.parseJSON(data);

    // apply filters
    if (pause) return;
    if (! wikipediaFilter(msg)) return;
    if (! userFilter(msg)) return;
    if (Math.abs(msg.delta) < deltaLimit) return;

    var lang = $('<span>').attr({'class': 'lang'}).text('[' + msg.wikipediaShort + ']');
    var a = $('<a>').attr({'class': 'page', 'href': msg.url, 'title': msg.comment, target: '_new'}).text(msg.page);
    var delta = $('<span>').attr({'class': 'delta'}).text(msg.delta);
    var d = $('<div>').attr({'class': 'update ' + msg.flag})
      .append(userIcon(msg))
      .append(lang)
      .append(a)
      .append(delta)
      .hide();
    $('#updates').prepend(d);
    d.slideDown('fast');
    $('.update').slice(30).detach();
  });

  setupControls();
  $(document).bind('keydown', 'p', togglePause);
}

function togglePause() {
  pause = ! pause;
  if (pause) {
    $('header').block({ 
      message: 'Paused<br/>Press \'p\' to unpause.', 
      css: {border: 'none',
        color: '#fff',
        backgroundColor: 'transparent',
        width: '400px'
      } 
    });
  } else {
    $('header').unblock();
  }
}

function userIcon(msg) {
  t = userType(msg);
  if (t == "robot") {
    return $('<img>').attr({'src': '/images/robot.png',
             'title': 'Bot: ' + msg.user})
  } else if (t == "anonymous") {
    return $('<img>').attr({'src': '/images/question.png',
             'title': 'Anonymous: ' + msg.user});
  } else {
    return $('<img>').attr({'src': '/images/person.png',
             'title': 'User: ' + msg.user});
  }
}

function setupControls() {
  setupSlider();
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
}

function setupSlider() {
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
}

function wikipediaFilter(msg) {
    if (wikipediaLimit == "all") return true;
    if (wikipediaLimit == msg.wikipedia) return true;
    return false;
}

function userFilter(msg) {
    t = userType(msg);
    if (! includeRobots && t == "robot") {
        return false;
    } else if (! includeAnonymous && t == "anonymous") {
        return false;
    } else if (! includeUsers && t == "user") {
        return false;
    }
    return true;
}

function userType(msg) {
  if (msg.flag === 'MB' || msg.flag === 'B') {
      return "robot";
  } else if (msg.user.match(/\d+\.\d+\.\d+\.\d+/)) {
    return "anonymous";
  } else {
    return "user";
  }
}
