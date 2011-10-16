$(document).ready(trends);

function add_stats(id, d) {
  for (var i in d) {
    $(id).append($('<li>').append($('<a>').attr({href: d[i].url, target: "_new"}).text(d[i].name + " [" + d[i].wikipedia + "] (" + d[i].score + ")")))
  }
}

function trends() {
  $.getJSON('/stats/articles-hourly.json', function (d) {
    $("#articlesHourly ol").empty();
    add_stats("#articlesHourly ol", d);
  });
  $.getJSON('/stats/articles-daily.json', function (d) {
    $("#articlesDaily ol").empty();
    add_stats("#articlesDaily ol", d);
  });
  $.getJSON('/stats/users-daily.json', function (d) {
    $("#usersDaily ol").empty();
      add_stats("#usersDaily ol", d);
  });
  $.getJSON('/stats/robots-daily.json', function (d) {
    $("#robotsDaily ol").empty();
    add_stats("#robotsDaily ol", d);
  });
  setTimeout(trends, 10000);
}
