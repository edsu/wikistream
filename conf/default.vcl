# varnish config for wikistream so that images and repeated requests
# for image json are cached

backend default {
    .host = "127.0.0.1";
    .port = "3000";
}

# for websocket support we need this

sub vcl_pipe {
    if (req.http.upgrade) {
        set bereq.http.upgrade = req.http.upgrade;
    }
}

sub vcl_recv {
    if (req.http.Upgrade ~ "(?i)websocket") {
        return (pipe);
    }
}
