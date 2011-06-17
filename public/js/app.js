$(document).ready(init);
var pause = false;

function init() {
    var socket = new io.Socket();
    socket.connect();
    socket.on("message", function(data){
        if (pause) return;
        var msg = jQuery.parseJSON(data);
        var lang = $("<span>").attr({"class": "lang " + msg.lang}).text("[" + msg.lang + "]");
        var a = $("<a>").attr({href: msg.url, title: msg.comment, target: '_new'}).text(msg.page);
        var d = $("<div>").attr({"class": "update " + msg.flag})
            .append(lang)
            .append(a)
            .hide();
        $('#updates').prepend(d);
        d.slideDown("fast");
        $('.update').slice(30).detach();
    });

    function toggle_pause() {
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

    $(document).bind('keydown', 'p', toggle_pause);
}
