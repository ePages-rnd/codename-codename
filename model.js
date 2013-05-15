/*global Meteor*/

/*
 * state        - searching, full, playing, over
 * gamermaster  - user5
 * location     - x, y
 * team1        - [user5, user3, user2]
 * team2        - [user4, user1]
 */
Games = new Meteor.Collection('Games');

/*

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

/*
    gameid
    gamemaster
    position

    team1 id
    team2 id
*/

/*
    Teams

    [player1, ...]
*/

Meteor.methods({
    createGame: function (options) {
        options = options || {};
        var user = options.user;
        var location = {
            'x': 150,
            'y': 120
        };
        return Games.insert({
            'state': 'searching',
            'gamemaster': user,
            'location': location,
            'team1': [user],
            'team2': []
        });
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

        // check that game is searching

        // check that player isnt in game

        // check that game isnt full

        if(game.team1.length > game.team2.length) {
            Games.update(gameid, {
                $addToSet: {team2: user}
            });
        }else {
            Games.update(gameid, {
                $addToSet: {team1: user}
            });
        }
    },
    leaveGame: function (options) {
        options = options || {};
        var gameid = options.gameid;

        var game = Games.findOne(gameid);
        var user = options.user;

        Games.update(gameid, {
            $pull: {'team1':user}
        });

        Games.update(gameid, {
            $pull: {'team2':user}
        });
    }
});
