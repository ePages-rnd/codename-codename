/*global window, google*/
/*global Meteor, Session, Template*/
/*global Players, Spots*/
'use strict';
var min_distance = 150;
var min_distance_enemy = 50;
var max_distance = 300;

var MapSpot = Backbone.Model.extend({

});

var MapSpots = Backbone.Collection.extend({
    model: MapSpot
});

var MyMapSpots = new MapSpots();

Template.game.events({
    'click #create-spot-btn': function () {
        console.log(Session.get('currentposition'));
    }
});

Template.game.currentposition = function () {
    var pos = Session.get('currentposition');
    return 'lat: ' + pos.lat + ' long: ' + pos.long;
};

Meteor.startup(function () {
    var players = {};


    Players.find().observe({
        'changed': function (old, player) {
            var map = window.cmiyc.map;
            var marker = players[player._id];
            var position = new google.maps.LatLng(player.position.lat, player.position.long);

            if (!marker) {
                //createMarker
                marker = new google.maps.Marker({
                    position: position,
                    map: map,
                    icon: {
                        url: 'player.png',
                        size: new google.maps.Size(16, 16),
                        origin: new google.maps.Point(0, 0),
                        anchor: new google.maps.Point(8, 8)
                    }
                });

                players[player._id] = marker;
            } else {
                marker.setPosition(position);
            }
        }
    });

    Spots.find().observe({
        'added': function (spot) {
            var map = window.cmiyc.map;
            var team = spot.team;
            var myteam = Session.get('currentteam');

            var map_spot = MyMapSpots.get(spot._id); //spots[spot._id];
            if (!map_spot) {
                console.log('new spot')
                var position = new google.maps.LatLng(spot.position.lat, spot.position.long);

                var distances = {};

                var mindistance = min_distance;
                var violates_distances = false;

                MyMapSpots.forEach(function (ms) {
                    var distance = google.maps.geometry.spherical.computeDistanceBetween(position, ms.get('position'));
                    distances[ms.get('id')] = distance;
                    if ((ms.get('team') === team && distance < min_distance) || distance < min_distance_enemy) {
                        violates_distances = true;
                    }
                });

                if (!violates_distances) {
                    var icon = (team === myteam) ? 'team1_spot.png' : 'team2_spot.png';
                    var color = (team === myteam) ? '#00FF00' : '#FF0000';
                    var image = {
                        url: icon,
                        size: new google.maps.Size(16, 16),
                        origin: new google.maps.Point(0, 0),
                        anchor: new google.maps.Point(8, 8)
                    };
                    var marker = new google.maps.Marker({
                        position: position,
                        map: map,
                        icon: image
                    });

                    MyMapSpots.add({
                        'id': spot._id,
                        'marker': marker,
                        'position': position,
                        'team': team
                    });

                    var nearbyspots = {};
                    for (var key in distances) {
                        if (distances[key] < max_distance && MyMapSpots.get(key).get('team') === team) {
                            nearbyspots[key] = 1;
                        }
                    }
                    for (var key1 in nearbyspots) {
                        for (var key2 in nearbyspots) {
                            if (key1 !== key2) {
                                var spot1 = MyMapSpots.get(key1);
                                var spot2 = MyMapSpots.get(key2);
                                if (google.maps.geometry.spherical.computeDistanceBetween(spot1.get('position'), spot2.get('position')) < max_distance) {
                                    var triangleCoords = [position, spot1.get('position'), spot2.get('position'), position];

                                    var triangle = new google.maps.Polygon({
                                        paths: triangleCoords,
                                        strokeColor: color,
                                        strokeOpacity: 0.8,
                                        strokeWeight: 2,
                                        fillColor: color,
                                        fillOpacity: 0.35
                                    });

                                    triangle.setMap(map);
                                }
                            }
                        }
                    }


                }
            }
        }
    });

});
