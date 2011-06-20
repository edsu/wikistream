$(document).ready(init);

var pause = false;
var deltaLimit = 0;

function init() {
    var socket = new io.Socket();
    socket.connect();
    socket.on("message", function(data){
        if (pause) return;

        var msg = jQuery.parseJSON(data);

        if (Math.abs(msg.delta) < deltaLimit) return;

        var lang = $("<span>").attr({"class": "lang " + msg.lang}).text("[" + msg.lang + "]");
        var a = $("<a>").attr({href: msg.url, title: msg.comment, target: '_new'}).text(msg.page);
        var delta = $("<span>").attr({"class": "delta"}).text(msg.delta);
        var d = $("<div>").attr({"class": "update " + msg.flag})
            .append(userIcon(msg))
            .append(lang)
            .append(a)
            .append(delta)
            .hide();
        $('#updates').prepend(d);
        d.slideDown("fast");
        $('.update').slice(30).detach();
    });

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
    $("#slider").slider({
        range: "min",
        value: 0,
        min: 0,
        max: 1000,
        step: 50,
        slide: function(event, ui) {
            deltaLimit = parseInt(ui.value);
            $("#deltaLimit").text(ui.value);
        }
    });
}

function userIcon(msg) {
    if (msg.flag === "MB" || msg.flag === "B") {
        return $("<img>").attr({src: "/images/robot.png",
                                title: "Bot: " + msg.user})
    } else {
        return $("<img>").attr({src: "/images/person.png",
                                title: "User: " + msg.user});
    }
}
