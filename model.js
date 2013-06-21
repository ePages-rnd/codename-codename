/*global Meteor*/
/*global Games, Teams, Spots, Players, Areas*/

/*
 * state        - searching, full, playing, over
 * gamermaster  - user5
 * location     - x, y
 * team1        - 1234
 * team2        - 3423
 */
Games = new Meteor.Collection('Games');

Games.MAX_PLAYERS = 12;
Games.START_POSITION = {
    'lat': 50.927054,
    'long': 11.589237
};
Games.KEEP_ALIVE = 60;

/*
 * [player1_id, player2_id]
 */
Teams = new Meteor.Collection('Teams');
Teams.START_POINTS = 500;
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

Spots.fastDistance = function (pos1, pos2) {
    var a = pos1.lat - pos2.lat;
    var b = pos1.long - pos2.long;
    return Math.sqrt(a * a + b * b) * 111000;
};

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
};

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

Players.MAX_TIME_ENEMY = 10;
Players.MAX_DISTANCE_ENEMY_AREA = 25;

/*
 * {
 *      'team': 'team123',
 *      'spots': [spot1,spot2,spot3]
 * }
 */
Areas = new Meteor.Collection('Areas');


Areas.contains = function (spot1, spot2, spot3, x) {
    if (Spots.fastDistance(spot1.position, x) > Spots.MAX_DISTANCE) {
        return false;
    }

    var getSide = function (p1, p2, x) {
            var side = (p2.lat - p1.lat) * (x.long - p1.long) - (x.lat - p1.lat) * (p2.long - p1.long);
            return side === 0 ? 0 : side > 0 ? 1 : -1;
        };

    if (!spot1 || !spot2 || !spot3) {
        return false;
    }

    var o1 = getSide(spot1.position, spot2.position, x);
    var o2 = getSide(spot2.position, spot3.position, x);
    var o3 = getSide(spot3.position, spot1.position, x);

    return (o1 === o2) && (o2 === o3);
};


Areas.intersect = function (a1, b1, c1, a2, b2, c2) {
    var CCW = function (p1, p2, p3) {
            var a = p1.long;
            var b = p1.lat;
            var c = p2.long;
            var d = p2.lat;
            var e = p3.long;
            var f = p3.lat;

            return (f - b) * (c - a) > (d - b) * (e - a);
        };

    var cut = function (p1, p2, p3, p4) {
            return (CCW(p1, p3, p4) !== CCW(p2, p3, p4)) && (CCW(p1, p2, p3) !== CCW(p1, p2, p4));
        };

    return cut(a1, b1, a2, b2) || cut(a1, b1, a2, c2) || cut(a1, b1, b2, c2) || cut(a1, c1, a2, b2) || cut(a1, c1, a2, c2) || cut(a1, c1, b2, c2);
};

Spots.MIN_DISTANCE = 150;
Spots.MIN_DISTANCE_ENEMY = 50;
Spots.MAX_DISTANCE = 300;

HighScores = new Meteor.Collection('HighScores');

Meteor.methods({
    createGame: function (options) {
        options = options || {};
        var user = options.user;
        var location = options.location;

        var team1 = Teams.insert({
            'points': Teams.START_POINTS,
            'players': [user]
        });

        var team2 = Teams.insert({
            'points': Teams.START_POINTS,
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
        };
    },
    startGame: function (options) {
        options = options || {};
        var gameid = options.gameid;
        var bots = options.bots;

        Meteor.call('_startGameServer', {
            'gameid': gameid,
            'bots': bots
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

        if (!team1 || !team2) {
            return;
        }
        // check that game is searching
        // check that player isnt in game
        // check that game isnt full
        var teamtojoin = team1.players.length > team2.players.length ? game.team2 : game.team1;

        Teams.update(teamtojoin, {
            '$addToSet': {
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
            '$pull': {
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
        var gamespots = Spots.find({
            $or: [{
                'team': game.team1
            }, {
                'team': game.team2
            }]
        }).fetch();
        var spots = {};

        for (var spotid in gamespots) {
            var spot = gamespots[spotid];
            if (spot.team === teamid) {
                spots[spot._id] = spot;
                var distance = Spots.distance(position, spot.position);
                if (distance < Spots.MIN_DISTANCE) {
                    return;
                }
            }
        }

        var enemyteam = teamid === game.team1 ? game.team2 : game.team1;
        for (var spotid in gamespots) {
            var spot = gamespots[spotid];
            if (spot.team === enemyteam) {
                spots[spot._id] = spot;
                var distance = Spots.distance(position, spot.position);
                if (distance < Spots.MIN_DISTANCE_ENEMY) {
                    return;
                }
            }
        }

        var areas = Areas.find({
            team: enemyteam
        }).fetch();
        for (var areaid in areas) {
            var area = areas[areaid];
            var spot1 = spots[area.spots[0]];
            var spot2 = spots[area.spots[1]];
            var spot3 = spots[area.spots[2]];

            if (Areas.contains(spot1, spot2, spot3, position)) {
                return;
            }
        }

        var spotid = Spots.insert({
            'team': teamid,
            'player': player,
            'position': position
        });

        Meteor.call('givePoints', {
            'playerid': player,
            'points': 1
        });

        return spotid;
    },
    deleteSpot: function (options) {
        options = options || {};
        var spot = options.spot;

        Spots.remove(spot);

        //delete area containing this spot
        Areas.remove({
            'spots': spot
        });
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
    },
    removePoints: function (options) {
        options = options || {};
        var teamid = options.teamid;
        var points = options.points;
        Teams.update(teamid, {
            '$inc': {
                'points': -1 * points
            }
        });
    },
    givePoints: function (options) {
        options = options || {};
        var playerid = options.playerid;
        var points = options.points;
        HighScores.update(playerid, {
            '$inc': {
                'points': points
            }
        }, {
            'upsert': true
        });
    },
    keepAlive: function (options) {
        options = options || {};
        var playerid = options.playerid;
        Players.update(playerid, {
            'keepalive': new Date().getTime()
        });
    },
    killNotAlives: function (options) {
        options = options || {};
        var std = Players.update({
            '$and': [{
                'keepalive': {
                    '$lt': new Date().getTime() - (1000 * Games.KEEP_ALIVE)
                }
            }, {
                'bot': {
                    '$exists': false
                }
            }]

        }, {
            '$set': {
                dead: true
            }
        }, {
            'multi': true
        });
    }
});
