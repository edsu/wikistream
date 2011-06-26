$(document).ready(init);

var pause = false;
var deltaLimit = 0;
var wikipediaLimit = "all";
var includeRobots = true;
var includeUsers = true;
var includeAnonymous = true;

function init() {
  setupControls();
  var socket = new io.Socket();
  socket.connect();
  socket.on('message', function(data) {
    var msg = jQuery.parseJSON(data);

    // apply filters
    if (pause) return;
    if (! wikipediaFilter(msg)) return;
    if (! userFilter(msg)) return;
    if (Math.abs(msg.delta) < deltaLimit) return;

    // update the stream
    addUpdate(msg);
    removeOld();
  });
  stats();
  $(window).blur(togglePause);
  $(window).focus(togglePause);
}

function addUpdate(msg) {
  var lang = $('<span>').attr({'class': 'lang'}).text('[' + msg.wikipediaShort + ']');
  var a = $('<a>').attr({'class': 'page', 'href': msg.url, 'title': msg.comment, target: '_new'}).text(msg.page);
  var delta = $('<span>').attr({'class': 'delta'}).text(msg.delta);

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
      message: 'Paused<br/>Press \'p\' to unpause', 
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

  $(document).bind('keyup', 'p', togglePause);
  $(document).bind('keyup', 'pause', togglePause);
}

function wikipediaFilter(msg) {
    if (wikipediaLimit == "all") return true;
    if (wikipediaLimit == msg.wikipedia) return true;
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

function stats() {
    function add_stats(id, d) {
        for (var i in d) {
            $(id).append($('<li>').append($('<a>').attr({href: d[i].url, target: "_new"}).text(d[i].name + " [" + d[i].wikipedia + "] (" + d[i].score + ")")))
        }
    }

    $.getJSON('/stats/articles-hourly.json', function (d) {
        $("#articlesHourly").empty();
        add_stats("#articlesHourly", d);
    });
    $.getJSON('/stats/articles-daily.json', function (d) {
        $("#articlesDaily").empty();
        add_stats("#articlesDaily", d);
    });
    $.getJSON('/stats/users-daily.json', function (d) {
        $("#usersDaily").empty();
        add_stats("#usersDaily", d);
    });
    $.getJSON('/stats/robots-daily.json', function (d) {
        $("#robotsDaily").empty();
        add_stats("#robotsDaily", d);
    });

    setTimeout(stats, 10000);
}
