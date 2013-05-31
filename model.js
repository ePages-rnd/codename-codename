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

/*
 * [player1_id, player2_id]
 */
Teams = new Meteor.Collection('Teams');

/*
 * {
 *      'team': 'team123',
 *      'position': {
 *          'x': 123,
 *          'y': 456
 *      }
 * }
 */
Spots = new Meteor.Collection('Spots');

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
            'game' : gameid,
            'team' : team1
        }
    },
    startGame: function (options) {
        options = options || {};
        var gameid = options.gameid;

        Games.update(gameid, {
            $set: {
                'state': 'playing'
            }
        });
    },
    joinGame: function (options) {
        options = options || {};
        var gameid = options.gameid;

        var game = Games.findOne(gameid);
        var user = options.user;

        var team1 = Teams.findOne( game.team1 );
        var team2 = Teams.findOne( game.team2 );

        // check that game is searching

        // check that player isnt in game

        // check that game isnt full

        var teamtojoin = team1.players.length > team2.players.length ? game.team2 : game.team1;

        Teams.update(teamtojoin, {
            $addToSet: {players: user}
        });

        return {
            'game' : gameid,
            'team' : teamtojoin
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
            $pull: {'players':user}
        });
    }
});
