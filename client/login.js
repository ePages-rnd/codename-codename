/*global Template, Session, Random*/
/*global $*/
'use strict';
Template.login.events({
    'click button': function () {
        var username = $('#username-input').val() || 'player-' + Random.id();
        Session.set('username', username);
        Session.set('state', 'lobby');

        var position = {
            'lat': 50.927054,
            'long': 11.589237
        };

        Players.insert({
            '_id': username,
            'username': username,
            'position': position
        });

        window.navigator.geolocation.watchPosition(function (g) {
            var lat = g.coords.latitude;
            var long = g.coords.longitude;
            var gmaps = window.google.maps;
            var map = window.cmiyc.map;
            var pos = new gmaps.LatLng(lat, long);

            Session.set('currentposition', {
                'lat': lat,
                'long': long
            });
            var player = Players.findOne(username);
            if (player) {
                player.position = pos;
            }

            map.panTo(pos);

        }, function () {
            console.log(arguments);
        }, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 1000
        });
    }
});
