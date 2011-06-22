$(document).ready(init);

var pause = false;
var deltaLimit = 0;
var wikipediaLimit = "all";

function init() {
  var socket = new io.Socket();
  socket.connect();

  socket.on('message', function(data) {
    var msg = jQuery.parseJSON(data);

    if (pause) return;
    if (! wikipediaMatch(msg)) return

    if (Math.abs(msg.delta) < deltaLimit) return;

    var lang = $('<span>').attr({'class': 'lang'}).text('[' + msg.wikipediaShort + ']');
    var a = $('<a>').attr({href: msg.url, title: msg.comment, target: '_new'}).text(msg.page);
    var delta = $('<span>').attr({'class': 'delta'}).text(msg.delta);
    var d = $('<div>').attr({'class': 'update ' + msg.flag})
      .append(userIcon(msg))
      .append(lang)
      .append(delta)
      .append(a)
      .hide();
    $('#updates').prepend(d);
    d.slideDown('fast');
    $('.update').slice(30).detach();
  });

  setupControls();
  setupSlider();
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

function userIcon(msg) {
  if (msg.flag === 'MB' || msg.flag === 'B') {
    return $('<img>').attr({'src': '/images/robot.png',
             'title': 'Bot: ' + msg.user})
  } else if (msg.user.match(/\d+\.\d+\.\d+\.\d+/)) {
    return $('<img>').attr({'src': '/images/question.png',
             'title': 'Anonymous: ' + msg.user});
  } else {
    return $('<img>').attr({'src': '/images/person.png',
             'title': 'User: ' + msg.user});
  }
}

function setupControls() {
  $('select[name="wikis"]').change(function() {
    wikipediaLimit = ($('select[name="wikis"]').val());
  });
}

function wikipediaMatch(msg) {
    if (wikipediaLimit == "all") return true;
    if (wikipediaLimit == msg.wikipedia) return true;
    return false;
}

