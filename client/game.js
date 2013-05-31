/*global window, google*/
/*global Meteor, Session, Template*/
/*global Players, Spots*/
'use strict';
var min_distance = 150;
var max_distance = 300;
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
                    icon: 'player.png'
                });

                players[player._id] = marker;
            } else {
                marker.setPosition(position);
            }
        }
    });

    var spots = {};
    Spots.find().observe({
        'added': function (spot) {
            var map = window.cmiyc.map;
            var team = spot.team;
            var myteam = Session.get('currentteam');

            var map_spot = spots[spot._id];

            if (!map_spot) {
                var position = new google.maps.LatLng(spot.position.lat, spot.position.long);

                var distances = {};

                var mindistance = min_distance;
                for (var key in spots) {
                    var to = spots[key].position;
                    var distance = google.maps.geometry.spherical.computeDistanceBetween(position, to);
                    distances[key] = distance;
                    mindistance = (distance < mindistance) ? distance : mindistance;
                }
                if (mindistance === min_distance) {
                    var icon = (team === myteam) ? 'team1_spot.png' : 'team2_spot.png';
                    var color = (team === myteam) ? '#00FF00' : '#FF0000';
                    var marker = new google.maps.Marker({
                        position: position,
                        map: map,
                        icon: icon
                    });

                    spots[spot._id] = {
                        'marker': marker,
                        'position': position,
                        'team': team
                    }

                    var nearbyspots = {};
                    for (var key in distances) {
                        if (distances[key] < max_distance && spots[key].team === team) {
                            nearbyspots[key] = 1;
                        }
                    }
                    for (var key1 in nearbyspots) {
                        for (var key2 in nearbyspots) {
                            if (key1 !== key2) {
                                var spot1 = spots[key1];
                                var spot2 = spots[key2];
                                if (google.maps.geometry.spherical.computeDistanceBetween(spot1.position, spot2.position) < max_distance) {
                                    var triangleCoords = [position, spot1.position, spot2.position, position];

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
