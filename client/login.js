/*global Template, Session, Random*/
/*global $*/
'use strict';
Template.login.events({
    'click button': function () {
        var username = $('#username-input').val() || 'player-' + Random.id();
        Session.set('username', username);
        Session.set('state', 'lobby');

        var position = {
            'lat' : 0,
            'long' : 0
        };

        Players.insert({
            '_id'      : username,
            'username' : username,
            'position' : position
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

            Players.update(username, {$set: {'position': position}});

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
