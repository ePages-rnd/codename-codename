/*global Meteor*/
/*global Games, Teams, Spots, Players*/


/*
 * state        - searching, full, playing, over
 * gamermaster  - user5
 * location     - x, y
 * team1        - 1234
 * team2        - 3423
 */
Games = new Meteor.Collection('Games');

Games.MAX_PLAYERS = 12;

/*
 * [player1_id, player2_id]
 */
Teams = new Meteor.Collection('Teams');

/*
 * {
 *      'team': 'team123',
 *      'player': 'player123',
 *      'position': {
 *          'x': 123,
 *          'y': 456
 *      }
 * }
 */
Spots = new Meteor.Collection('Spots');

Spots.distance = function (pos1, pos2) {

    var rad = function (x) {
            return Math.PI * x / 180;
        };

    var earthradius = 6370694;

    var radlat1 = rad(pos1.lat);
    var radlat2 = rad(pos2.lat);

    var radtheta = rad(pos1.long - pos2.long);
    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    return Math.acos(dist) * earthradius;
}

/*
 * {
 *      'username': 'player-123',
 *      'position': {
 *          'x': 123,
 *          'y': 456
 *      }
 * }
 */
Players = new Meteor.Collection('Players');

Players.MAX_TIME_ENEMY = 5;
Players.MAX_DISTANCE_ENEMY_AREA = 50;

/*
 * {
 *      'team': 'team123',
 *      'spots': [spot1,spot2,spot3]
 * }
 */
Areas = new Meteor.Collection('Areas');

Areas.contains = function(spot1, spot2, spot3, x) {
    var getSide = function(p1, p2, x) {
        var side = (p2.lat - p1.lat) * (x.long - p1.long) - (x.lat - p1.lat) * (p2.long - p1.long);
        return side === 0 ? 0 : side > 0 ? 1 : -1;
    };

    if(!spot1 || !spot2 || !spot3) {return false};

    var o1 = getSide(spot1.position, spot2.position, x);
    var o2 = getSide(spot2.position, spot3.position, x);
    var o3 = getSide(spot3.position, spot1.position, x);

    return (o1 == o2) && (o2 == o3);
};


Areas.intersect = function (a1, b1, c1, a2, b2, c2) {
    var CCW = function (p1, p2, p3) {
      a = p1.long;
      b = p1.lat;
      c = p2.long;
      d = p2.lat;
      e = p3.long;
      f = p3.lat;

      return (f - b) * (c - a) > (d - b) * (e - a);
    };

    var cut = function(p1, p2, p3, p4) {
        return (CCW(p1, p3, p4) != CCW(p2, p3, p4)) && (CCW(p1, p2, p3) != CCW(p1, p2, p4));
    };

    return cut(a1,b1,a2,b2) || cut(a1,b1,a2,c2) || cut(a1,b1,b2,c2) || cut(a1,c1,a2,b2) || cut(a1,c1,a2,c2) || cut(a1,c1,b2,c2);
}

Spots.MIN_DISTANCE = 150;
Spots.MIN_DISTANCE_ENEMY = 50;
Spots.MAX_DISTANCE = 300;



'use strict';

Meteor.methods({
    createGame: function (options) {
        options = options || {};
        var user = options.user;
        var location = options.location;

        var team1 = Teams.insert({
            'players': [user]
        });

        var team2 = Teams.insert({
            'players': []
        });

        var gameid = Games.insert({
            'state': 'searching',
            'gamemaster': user,
            'location': location,
            'team1': team1,
            'team2': team2
        });
        return {
            'game': gameid,
            'team': team1
        }
    },
    startGame: function (options) {
        options = options || {};
        var gameid = options.gameid;

        Meteor.call('_startGameServer', {
            gameid: gameid
        }, function () {
            Games.update(gameid, {
                $set: {
                    'state': 'playing'
                }
            });
        });


    },
    joinGame: function (options) {
        options = options || {};
        var gameid = options.gameid;

        var game = Games.findOne(gameid);
        var user = options.user;

        var team1 = Teams.findOne(game.team1);
        var team2 = Teams.findOne(game.team2);

        // check that game is searching
        // check that player isnt in game
        // check that game isnt full
        var teamtojoin = team1.players.length > team2.players.length ? game.team2 : game.team1;

        Teams.update(teamtojoin, {
            $addToSet: {
                players: user
            }
        });

        return {
            'game': gameid,
            'team': teamtojoin
        };
    },
    leaveGame: function (options) {
        options = options || {};
        var gameid = options.gameid;
        var teamid = options.teamid;
        var user = options.user;

        var game = Games.findOne(gameid);

        if (user === game.gamemaster) {
            Games.remove(gameid);
            return;
        }

        Teams.update(teamid, {
            $pull: {
                'players': user
            }
        });
    },
    createSpot: function (options) {
        options = options || {};
        var gameid = options.gameid;
        var teamid = options.teamid;
        var player = options.player;
        var position = options.position;

        if (!gameid || !teamid || !player || !position) {
            return;
        }

        var game = Games.findOne(gameid);
        if (!game) {
            return;
        }

        var violates = false;
        Spots.find({
            team: teamid
        }).forEach(function (spot) {
            var distance = Spots.distance(position, spot.position);
            if (distance < Spots.MIN_DISTANCE) {
                violates = true;
            }
        });
        if (violates) {
            return;
        }

        var enemyteam = teamid === game.team1 ? game.team2 : game.team1;
        Spots.find({
            team: enemyteam
        }).forEach(function (spot) {
            var distance = Spots.distance(position, spot.position);
            if (distance < Spots.MIN_DISTANCE_ENEMY) {
                violates = true;
            }
        });
        if (violates) {
            return;
        }

        // not in enemy territory


        Areas.find({team:enemyteam}).forEach(function(area) {
            var spot1 = Spots.findOne(area.spots[0]);
            var spot2 = Spots.findOne(area.spots[1]);
            var spot3 = Spots.findOne(area.spots[2]);

            if(Areas.contains(spot1, spot2, spot3, position)) {
                violates = true;
            }
        });
        if (violates) {
            return;
        }

        var spotid = Spots.insert({
            'team': teamid,
            'player': player,
            'position': position
        });


        return spotid;
    },
    deleteSpot: function (options) {
        options = options || {};
        var spot = options.spot;

        Spots.remove(spot);

        //delete area containing this spot
        Areas.remove({spots:spot});
    },
    createArea: function (options) {
        options = options || {};
        var team = options.team;
        var spot1 = Spots.findOne(options.spot1);
        var spot2 = Spots.findOne(options.spot2);
        var spot3 = Spots.findOne(options.spot3);

        if (!team || !spot1 || !spot2 || !spot3) {
            return;
        }

        var dist1 = Spots.distance(spot1.position, spot2.position);
        var dist2 = Spots.distance(spot1.position, spot3.position);
        var dist3 = Spots.distance(spot2.position, spot3.position);

        if (dist1 < Spots.MIN_DISTANCE || dist1 > Spots.MAX_DISTANCE || dist2 < Spots.MIN_DISTANCE || dist2 > Spots.MAX_DISTANCE || dist3 < Spots.MIN_DISTANCE || dist3 > Spots.MAX_DISTANCE) {
            return;
        }

        var areaid = Areas.insert({
            'team': team,
            'spots': [options.spot1, options.spot2, options.spot3]
        });

        return areaid;
    }
});
