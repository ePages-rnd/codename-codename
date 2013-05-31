/*global Meteor*/
/*global Template*/
/*global console*/
/*global window*/
/*global document*/

/*global MarkedSpots, Deps, Session*/
'use strict';

Deps.autorun(function () {
    Meteor.subscribe('AvailableGames', Session.get('currentgame'));
    Meteor.subscribe('CurrentGameTeams', Session.get('currentgame'));
    Meteor.subscribe('MyTeam', Session.get('currentteam'));
    Meteor.subscribe('GameSpots', Session.get('currentgame'));
});

Meteor.startup(function () {
    Session.set('state', 'login');
});

window.cmiyc = window.cmiyc || {};

window.cmiyc.initialize = function () {
    var gmaps = window.google.maps;
    Session.set('currentposition', {
        'lat': 0,
        'long': 0
    });

    var mapOptions = {
        center: new gmaps.LatLng(40.77153, -73.97722),
        zoom: 16,
        disableDefaultUI: true,
        mapTypeId: gmaps.MapTypeId.ROADMAP,
        scaleControl: false,
        draggable: false,
        scrollwheel: false,
        styles: [{
            "elementType": "labels",
            "stylers": [{
                "visibility": "off"
            }]
        }]
    };
    window.cmiyc.map = new gmaps.Map(document.getElementById('map_canvas'), mapOptions);
};

Template.overlay.overlay = function () {
    var state = Session.get('state');
    if (typeof Template[state] === 'function') { return Template[state](arguments); }

    return 'Application is in an undefined state';
};
