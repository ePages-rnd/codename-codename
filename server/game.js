/*global Meteor*/

/*global Games, Players, Teams, Spots, Areas*/
'use strict';


function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

Meteor.methods({
    _startGameServer: function (options) {
        var intervalid;
        options = options || {};
        var gameid = options.gameid;
        var game = Games.findOne(gameid);
        var team1 = Teams.findOne(game.team1);
        var team2 = Teams.findOne(game.team2);

        var gameover = false;

        var gamespots = {};
        var areas = {};
        var gamestep = 0;

        Spots.find({
            $or: [{
                team: game.team1
            }, {
                team: game.team2
            }]
        }).observe({
            'added': function (spot) {
                // check if this creates area
                var distances = {};
                var spotid, key1, key2;
                for (spotid in gamespots) {
                    var distance = Spots.distance(spot.position, gamespots[spotid].position);
                    if (distance < Spots.MAX_DISTANCE && gamespots[spotid].team === spot.team) {
                        distances[spotid] = distance;
                    }
                }
                for (key1 in distances) {
                    for (key2 in distances) {
                        if (key1 !== key2) {
                            var spot1 = gamespots[key1];
                            var spot2 = gamespots[key2];
                            if (Spots.distance(spot1.position, spot2.position) < Spots.MAX_DISTANCE) {

                                Meteor.call('createArea', {
                                    game: gameid,
                                    team: spot.team,
                                    spot1: spot._id,
                                    spot2: spot1._id,
                                    spot3: spot2._id
                                });
                            }
                        }
                    }
                }

                gamespots[spot._id] = spot;
            },
            'removed': function (spot) {
                Meteor.call('removePoints', {
                    'teamid': spot.team,
                    'points': 3
                });
                delete gamespots[spot._id];
            }
        });

        Areas.find({
            '$or': [{
                'team': game.team1
            }, {
                'team': game.team2
            }]
        }).observe({
            'added': function (area) {
                areas[area._id] = area;
                var spot1 = Spots.findOne(area.spots[0]);
                var spot2 = Spots.findOne(area.spots[1]);
                var spot3 = Spots.findOne(area.spots[2]);

                if (!spot1 || !spot2 || !spot3) {
                    return;
                }

                var oppositeteam = area.team === game.team1 ? game.team2 : game.team1;

                // find enemy spots inside the area and delete them
                var enemyspots = Spots.find({
                    team: oppositeteam
                }).forEach(function (spot) {
                    if (Areas.contains(spot1, spot2, spot3, spot.position)) {
                        Meteor.call('deleteSpot', {
                            spot: spot._id
                        });
                    }
                });

                Areas.find({
                    team: oppositeteam
                }).forEach(function (oarea) {
                    var a = Spots.findOne(oarea.spots[0]);
                    var b = Spots.findOne(oarea.spots[1]);
                    var c = Spots.findOne(oarea.spots[2]);

                    if (!a || !b || !c) {
                        return;
                    }

                    if (Areas.intersect(spot1.position, spot2.position, spot3.position, a.position, b.position, c.position)) {
                        Areas.remove(oarea._id);
                    }
                });
            },
            'removed': function (area) {
                Meteor.call('removePoints', {
                    'teamid': area.team,
                    'points': 10
                });
                delete areas[area._id];
            }
        });

        Teams.find({
            '$or': [{
                '_id': game.team1
            }, {
                '_id': game.team2
            }]
        }).observe({
            'changed': function (team, oldteam) {
                if (team.points <= 0) {
                    gameover = true;
                }
            }
        });


        function gameloop() {
            //check if player is inside enemy territory -> kill him
            var time = new Date().getTime();
            var playerid;

            var inEnemyArea = function (player, enemyteam) {
                    var result = false;
                    Areas.find({
                        team: enemyteam
                    }).forEach(function (area) {
                        if (result) {
                            return;
                        }
                        var a = Spots.findOne(area.spots[0]);
                        var b = Spots.findOne(area.spots[1]);
                        var c = Spots.findOne(area.spots[2]);

                        if (!a || !b || !c) {
                            return;
                        }
                        result = result || Areas.contains(a, b, c, player.position);
                    });
                    return result;
                };

            var nearbyPlayer = function (player, teamid) {
                    var playerid, result;
                    var team = Teams.findOne(teamid);
                    team.players.forEach(function (playerid) {
                        if (result) {
                            return;
                        }
                        if (playerid !== player._id) {
                            var oplayer = Players.findOne(playerid);
                            var distance = Spots.distance(player.position, oplayer.position);
                            if (distance < Players.MAX_DISTANCE_ENEMY_AREA) {
                                result = result || true;
                            }
                        }
                    });
                    return result;
                };

            var setPlayerStatus = function (playerid, team, enemyteam) {
                    var player = Players.findOne(playerid);
                    if (!player.dead) {
                        if (player.enterEnemyArea) {
                            //check if player is dead now
                            if ((time - player.enterEnemyArea) > Players.MAX_TIME_ENEMY * 1000) {
                                Players.update(player, {
                                    '$set': {
                                        'dead': true
                                    }
                                });
                                Meteor.call('removePoints', {
                                    'teamid': team,
                                    'points': 50
                                });
                                console.log('player is dead');
                            } else {
                                if (!inEnemyArea(player, enemyteam)) { //|| nearbyPlayer(player, team
                                    Players.update(player, {
                                        '$unset': {
                                            'enterEnemyArea': ''
                                        }
                                    });
                                }
                            }

                        } else {
                            //check if player enters enemy area
                            if (inEnemyArea(player, enemyteam)) { //&& !nearbyPlayer(player, team)
                                Players.update(player, {
                                    '$set': {
                                        'enterEnemyArea': time
                                    }
                                });
                            }
                        }
                    }
                };

            var teamstatus = function (team) {
                    var dead = true;
                    team.players.forEach(function (playerid) {
                        if (!dead) {
                            return;
                        }
                        var player = Players.findOne(playerid);
                        if (!player) {
                            return;
                        }
                        if (!player.dead) {
                            dead = false;
                        }
                    });
                    return dead;
                };
            team1.players.forEach(function (playerid) {
                setPlayerStatus(playerid, team1._id, team2._id);
            });
            team2.players.forEach(function (playerid) {
                setPlayerStatus(playerid, team2._id, team1._id);
            });

            var team1dead = teamstatus(team1);
            var team2dead = teamstatus(team1);

            if (team1dead || team2dead || gameover) {
                Meteor.clearInterval(intervalid);
                intervalid = undefined;

                // game is over
                Meteor.call('_stopGameServer', {
                    gameid: gameid
                });
            }
            if (gamestep % 3 === 0) {
                // decrease the points of the teams
                var team1spots = Spots.find({
                    team: team1._id
                }).count();
                var team2spots = Spots.find({
                    team: team2._id
                }).count();

                if (team1spots > team2spots) {
                    Meteor.call('removePoints', {
                        'teamid': team2._id,
                        'points': 1
                    });
                } else if (team2spots > team1spots) {
                    Meteor.call('removePoints', {
                        'teamid': team1._id,
                        'points': 1
                    });
                }
            }
            gamestep++;
        }

        var startBot = function (username, team) {
                var step = 0;
                var botintervalid;
                var player;
                var setSpot = function () {
                        if (!player) {
                            return;
                        }

                        Meteor.call('createSpot', {
                            'gameid': gameid,
                            'teamid': team,
                            'player': username,
                            'position': player.position
                        });
                    };

                var changePosition = function () {
                        if (!player) {
                            return;
                        }

                        var position = player.position;
                        var change = getRandomInt(0, 3);
                        var diff = Math.random() / 500;
                        if (change === 0) {
                            position.lat += diff;
                        }
                        if (change === 1) {
                            position.lat -= diff;
                        }
                        if (change === 2) {
                            position.long += diff;
                        }
                        if (change === 3) {
                            position.long -= diff;
                        }


                        Players.update(username, {
                            $set: {
                                'position': position
                            }
                        });
                    };

                function botloop() {
                    player = Players.findOne(username);
                    if (player.dead || !intervalid || gameover) {
                        Meteor.clearInterval(botintervalid);
                    } else {
                        step++;
                        changePosition();
                        setSpot();
                    }
                }
                botintervalid = Meteor.setInterval(botloop, 1000);
            };


        var i = 0;
        for (i = 0; i < Games.MAX_PLAYERS - (team1.players.length + team2.players.length); i++) {
            var username = 'bot_' + gameid + '_' + i;

            var position = Games.START_POSITION;

            var playerid = Players.insert({
                '_id': username,
                'username': username,
                'position': position
            });

            Meteor.call('joinGame', {
                'gameid': gameid,
                'user': playerid
            }, function (error, result) {
                if (!error) {
                    startBot(username, result.team);
                }
            });
        }
        team1 = Teams.findOne(game.team1);
        team2 = Teams.findOne(game.team2);

        intervalid = Meteor.setInterval(gameloop, 1000);
    },
    _stopGameServer: function (options) {
        options = options || {};
        var gameid = options.gameid;

        var game = Games.findOne(gameid);
        var team1id = game.team1;
        var team2id = game.team2;

        var team1 = Teams.findOne(team1id);
        var team2 = Teams.findOne(team2id);

        Players.update({
            '$or': [{
                '_id': {
                    '$in': team1.players
                }
            }, {
                '_id': {
                    '$in': team2.players
                }
            }]
        }, {
            '$unset': {
                'dead': '',
                'enterEnemyArea': ''
            }
        });


        Games.update(gameid, {
            '$set': {
                'state': 'over'
            }
        });
/*
        Spots.remove({
            '$or': [{
                'team': team1id
            }, {
                'team': team2id
            }]
        });
        Areas.remove({
            '$or': [{
                'team': team1id
            }, {
                'team': team2id
            }]
        });
        Teams.remove({
            '$or': [{
                '_id': team1id
            }, {
                '_id': team2id
            }]
        });
        Games.remove(gameid);
        */
    }
});
