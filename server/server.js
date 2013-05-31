/*global Meteor*/

/*global Games, Players, Teams*/
'use strict';
Meteor.publish('AvailableGames', function (currentgame) {
    return Games.find({$or: [
            {'_id': currentgame},
            {'state': 'searching'}
        ]
    });
});

Meteor.publish('CurrentGameTeams', function (gameid) {
    var game = Games.findOne(gameid);
    if(! game) { return; }
    return Teams.find({ $or: [{'_id': game.team1}, {'_id': game.team2}] });
});

Meteor.publish('MyTeam', function ( teamid ) {
    var team = Teams.findOne(teamid);
    if(!team) { return; }
    return Players.find( {'_id': {$in: team.players} } );
});

Meteor.startup(function () {
    Games.find().observe({
        'added': function (game) {
            var gameid = game._id;
            var i = 0;

            for (i = 0; i < 9; i++) {
                var username = 'bot_' + gameid + '_' + i + '_' + Math.random();

                var position = {
                    'lat': 50.9287527,
                    'long': 11.5841073
                };

                var playerid = Players.insert({
                    '_id': username,
                    'username': username,
                    'position': position
                });

                Meteor.call('joinGame', {
                    'gameid': gameid,
                    'user': playerid
                });
            }

        }
    });

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    var changePosition = function (playerid) {
            var player = Players.findOne(playerid);
            if (player === null) {
                return;
            }

            var position = player.position;
            var change = getRandomInt(0, 3);
            var diff = Math.random() / 5000;
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

            Players.update(playerid, {
                $set: {
                    'position': position
                }
            });
        };
    var changePositions = function () {
            var players = Players.find();
            players.forEach(function (player) {
                changePosition(player._id);
            });
        };


    Meteor.setInterval(changePositions, 150);
});
