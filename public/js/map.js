$(document).ready(init);

function init() {
  
  resizeMap();
  initMap('map', {
    bounds: [ -77.0912999946865, 38.8817999904487, -77.034200020956, 38.8817999904487 ],
    lon: 0,
    lat: 14,
    zoom: 2
  });
}

function initMap(id, options) {

	var defaults = {
	        base: 'osm',
	        zoom: 2,
	        lat: 15,
	        lon: 0,
	        lang: 'en',
        	maxExtent: new OpenLayers.Bounds(-20037508.34, -20037508.34, 20037508.34, 20037508.34)
	};

	OpenLayers.IMAGE_RELOAD_ATTEMPTS = 3;
	OpenLayers.ImgPath = '/ol/img/';

	options = $.extend(defaults, options);

	if ( options.bounds ) {
		options.maxExtent = new OpenLayers.Bounds(options.bounds[0], options.bounds[1], options.bounds[2], options.bounds[3]).transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913"));
	} 

	var mapOptions = {
		projection: new OpenLayers.Projection("EPSG:900913"),
		displayProjection : new OpenLayers.Projection("EPSG:4326"),
		units : 'm',
		numZoomLevels: 18,
		maxExtent: options.maxExtent,
		maxResolution: 156543.0399,
		theme : '/ol/themes/default',
                controls: [
	          	new OpenLayers.Control.Navigation(),
                 	new OpenLayers.Control.PanZoom(),
	                new OpenLayers.Control.ZoomBox(),
		 	new OpenLayers.Control.Permalink(),
			new OpenLayers.Control.LayerSwitcher()
		]
	};

	var map = new OpenLayers.Map( 'map', mapOptions );

	var mapnik = new OpenLayers.Layer.XYZ( "OSM",
		"http://a.tile.openstreetmap.org/${z}/${x}/${y}.png",
		{ sphericalMercator: true } 
	);

	map.addLayer(mapnik);

        var center = new OpenLayers.LonLat(parseFloat(options.lon), parseFloat(options.lat)).
		transform(map.displayProjection, map.getProjectionObject());
        map.setCenter(center, options.zoom);

	var currentExtent = map.getExtent().toArray();

	map.render('map');
	map.zoomTo(options.zoom);

	var edits = new OpenLayers.Layer.Markers("Edits");
	map.addLayer(edits);

}

function resizeMap() {
  var h = $(window).height() - $('#header').height() - 50;
  $('#map').height(h);
}
