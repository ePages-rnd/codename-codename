/*global window, google*/
/*global Meteor, Session, Template*/
/*global Players, Spots, Areas*/
'use strict';
var players = {};
var spots = {};
var areas = {};

var resetMap = function () {
        var playerid, spotid, areaid;
        for (playerid in players) {
            var player = players[playerid];
            player.setMap(null);
        }
        players = {};
        for (spotid in spots) {
            var spot = spots[spotid];
            spot.setMap(null);
        }
        spots = {};
        for (areaid in areas) {
            var area = areas[areaid];
            area.setMap(null);
        }
        areas = {};
    };


var mapcords = function (cords) {
        return new google.maps.LatLng(cords.lat, cords.long);
    };

Template.game.events({
    'click #create-spot-btn': function () {
        Meteor.call('createSpot', {
            gameid: Session.get('currentgame'),
            teamid: Session.get('currentteam'),
            player: Session.get('username'),
            position: Session.get('currentposition')
        }, function (error, result) {

        });
    },
    'click #leave-game-btn': function () {
        var gameid = Session.get('currentgame');
        var teamid = Session.get('currentteam');
        var username = Session.get('username');

        Meteor.call('leaveGame', {
            'gameid': gameid,
            'teamid': teamid,
            'user': username
        }, function (error, result) {
            Session.set('currentgame', null);
            Session.set('currentteam', null);
            resetMap();
            Session.set('state', 'lobby');
        });
    }
});

Template.game.points = function() {
    var gameid = Session.get('currentgame');
    var game = Games.findOne(gameid);

    var myteam = Session.get('currentteam');
    var team1color = myteam === game.team1 ? '#00FF00' : '#FF0000';
    var team2color = myteam === game.team2 ? '#00FF00' : '#FF0000';

    if(!game) {return;}
    var team1 = Teams.findOne(game.team1);
    var team2 = Teams.findOne(game.team2);

    if(!team1 || !team2) {return;}

    return '<span style="color:' + team1color + '">' + team1.points + '</span> : <span style="color:' + team2color + '">' + team2.points + '</span>';
}

Meteor.startup(function () {
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
    var initGame = function (gameid) {
            var game = Games.findOne(gameid);
            if (!game) {
                return;
            }
            window.navigator.geolocation.watchPosition(function (g) {
                var username = Session.get('username');
                var lat = g.coords.latitude;
                var long = g.coords.longitude;
                var gmaps = window.google.maps;
                var map = window.cmiyc.map;
                var position = {
                    'lat': lat,
                    'long': long
                }
                Session.set('currentposition', position);
                var player = Players.findOne(username);
                if (player) {
                    player.position = position;
                }
                map.setCenter(mapcords(position));
            }, function () {
                console.log(arguments);
            }, {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 1000
            });

            var myteamid = Session.get('currentteam') === game.team1 ? game.team1 : game.team2;

            var myteam = Teams.findOne(myteamid);
            if (!myteam) {
                return;
            }

            myteam.players.forEach(function (playerid) {

                var player = Players.findOne(playerid);
                var marker = new google.maps.Marker({
                    position: mapcords(player.position),
                    map: window.cmiyc.map,
                    icon: playericon
                });

                players[player._id] = marker;
            });
        };
    Games.find().observe({
        'changed': function (game, old) {
            if (game.state === 'playing' && old.state !== 'playing') {
                initGame(game._id);
            }
        }
    });


    Players.find().observe({
        'changed': function (player, old) {
            var map = window.cmiyc.map;
            var marker = players[player._id];

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
            if(!marker) {
                var marker = new google.maps.Marker({
                    position: mapcords(player.position),
                    map: map,
                    icon: playericon
                });
                players[player._id] = marker;
            }
            if (marker) {
                if (status !== oldstatus) {
                    if (status === 'dead') {
                        marker.setIcon(playericondead);
                    } else if (status === 'warn') {
                        marker.setIcon(playericonwarn);
                    } else {
                        marker.setIcon(playericon);
                    }
                }
                var position = new google.maps.LatLng(player.position.lat, player.position.long);
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
            if (spots[spot._id]) {
                spots[spot._id].setMap(null);
                delete spots[spot._id];
            }
        }
    });

    Areas.find().observe({
        'added': function (area) {
            var map = window.cmiyc.map;
            var spot1 = Spots.findOne(area.spots[0]);
            var spot2 = Spots.findOne(area.spots[1]);
            var spot3 = Spots.findOne(area.spots[2]);
            var myteam = Session.get('currentteam');

            if (!spot1 || !spot2 || !spot3) {
                return;
            }

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
            if (areas[area._id]) {
                areas[area._id].setMap(null);
                delete areas[area._id];
            }
        }
    });

});
