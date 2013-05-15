/*global Meteor*/
/*global Template*/
/*global console*/
/*global window*/
/*global document*/

/*global MarkedSpots, Deps, Session*/
var map, gmaps;

Meteor.startup(function () {
    Session.set('state', 'login');
});

window.cmiyc = window.cmiyc || {};

window.cmiyc.initialize = function () {
    gmaps = window.google.maps;

    var mapOptions = {
        center: new gmaps.LatLng(40.77153, -73.97722),
        zoom: 4,
        disableDefaultUI: true,
        mapTypeId: gmaps.MapTypeId.SATELLITE
    };
    map = new gmaps.Map(document.getElementById('map_canvas'), mapOptions);
    var zoomservice = new gmaps.MaxZoomService();

    window.navigator.geolocation.watchPosition(
    function (g) {
        console.log(g);
        var lat = g.coords.latitude;
        var lon = g.coords.longitude;

        var pos = new gmaps.LatLng(lat, lon);

        Session.set('currentposition', {x:lat,y:lon});

        map.panTo(pos,5000);

        zoomservice.getMaxZoomAtLatLng(pos, function(maxzoomresult) {
            map.setZoom(maxzoomresult.zoom-4);
        });
    }, function () {
        console.log(arguments);
    }, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 30000
    });

};

/*
Template.main_menu.events({
    'click #main_menu_item4': function () {
        var center = map.getCenter();


        var marker = new gmaps.Marker({
            position: center,
            map: map
        });

        MarkedSpots.insert({
            'x': center.kb,
            'y': center.lb
        });
    }
});
*/

Template.overlay.overlay = function () {
    var state = Session.get('state');
    if (typeof Template[state] === 'function') return Template[state](arguments);

    return 'Application is in an undefined state';
};
