/*global window, google*/
/*global Meteor, Session, Template*/
/*global Players, Spots, Areas*/
'use strict';
var players = {};

Template.game.events({
    'click #create-spot-btn': function () {
        Meteor.call('createSpot', {
            gameid: Session.get('curremtgame'),
            teamid: Session.get('currentteam'),
            player: Session.get('username'),
            position: Session.get('currentposition')
        }, function (error, result) {

        });
    }
});

Template.game.currentposition = function () {
    var pos = Session.get('currentposition');
    var playerid = Session.get('username');

    var map = window.cmiyc.map;
    var marker = players[playerid];

    if (!marker) {
        var position = new google.maps.LatLng(pos.lat, pos.long);

        //createMarker
        marker = new google.maps.Marker({
            position: position,
            map: map
        });

        players[playerid] = marker;
    } else {
        marker.setPosition(position);
    }

    return 'lat: ' + pos.lat + ' long: ' + pos.long;
};

Meteor.startup(function () {
    var spots = {};
    var areas = {};

    var mapcords = function (cords) {
            return new google.maps.LatLng(cords.lat, cords.long);
        };

    var playericon = {
        url: 'player.png',
        size: new google.maps.Size(16, 16),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(8, 8)
    };
    var playericonwarn = {
        url: 'player_warn.png',
        size: new google.maps.Size(16, 16),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(8, 8)
    };

    var playericondead = {
        url: 'player_dead.png',
        size: new google.maps.Size(16, 16),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(8, 8)
    };


    Players.find().observe({
        'changed': function (player, old) {
            var map = window.cmiyc.map;
            var marker = players[player._id];
            var position = new google.maps.LatLng(player.position.lat, player.position.long);
            var status = player.dead ? 'dead' : player.enterEnemyArea ? 'warn' : '';
            var oldstatus = old.dead ? 'dead' : old.enterEnemyArea ? 'warn' : '';
            if (player._id === Session.get('username')) {
                if (player.dead) {
                    $('.overlay').css('background', 'rgba(255, 0, 0, .7)');
                } else if (player.enterEnemyArea) {
                    $('.overlay').css('background', 'rgba(255, 0, 0, .3)');
                } else {
                    $('.overlay').css('background', 'rgba(255, 0, 0, .00001)');
                }
            }

            if (!marker) {
                //createMarker
                marker = new google.maps.Marker({
                    position: position,
                    map: map,
                    icon: playericon
                });

                players[player._id] = marker;
            } else {
                if(status !== oldstatus) {
                    if(status === 'dead') {
                        marker.setIcon(playericondead);
                    }else if(status === 'warn') {
                        marker.setIcon(playericonwarn);
                    }else {
                        marker.setIcon(playericon);
                    }
                }

                marker.setPosition(position);
            }
        }
    });

    Spots.find().observe({
        'added': function (spot) {
            var map = window.cmiyc.map;
            var team = spot.team;
            var myteam = Session.get('currentteam');

            var position = spot.position;

            var icon = (team === myteam) ? 'team1_spot.png' : 'team2_spot.png';
            var color = (team === myteam) ? '#00FF00' : '#FF0000';
            var image = {
                url: icon,
                size: new google.maps.Size(16, 16),
                origin: new google.maps.Point(0, 0),
                anchor: new google.maps.Point(8, 8)
            };
            var marker = new google.maps.Marker({
                position: mapcords(position),
                map: map,
                icon: image
            });

            spots[spot._id] = marker;
        },
        'removed': function (spot) {
            spots[spot._id].setMap(null);
        }
    });

    Areas.find().observe({
        'added': function (area) {
            var map = window.cmiyc.map;
            var spot1 = Spots.findOne(area.spots[0]);
            var spot2 = Spots.findOne(area.spots[1]);
            var spot3 = Spots.findOne(area.spots[2]);
            var myteam = Session.get('currentteam');

            var color = (area.team === myteam) ? '#00FF00' : '#FF0000';

            var triangleCoords = [mapcords(spot1.position), mapcords(spot2.position), mapcords(spot3.position), mapcords(spot1.position)];

            var triangle = new google.maps.Polygon({
                paths: triangleCoords,
                strokeColor: color,
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: color,
                fillOpacity: 0.35
            });

            triangle.setMap(map);

            areas[area._id] = triangle;
        },
        'removed': function (area) {
            areas[area._id].setMap(null);
        }
    });

});
