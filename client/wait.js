/*global Template, Session, Meteor*/
/*global Games*/
'use strict';

Template.wait.events({
    'click #start-game-btn': function () {
        var gameid = Session.get('currentgame');
        if (!gameid) {
            Meteor.Error(413, 'no game selected');
        }
        Meteor.call('startGame', {
            'gameid': gameid
        }, function (error, game) {
            if (!error) {
                Session.set('state', 'game');
            }
        });
    },
    'click #leave-game-btn': function () {

        var gameid = Session.get('currentgame');
        if (!gameid) {
            Meteor.Error(413, 'no game selected');
        }

        var user = Session.get('username');
        Meteor.call('leaveGame', {
            'gameid': gameid,
            'user': user
        }, function (error, game) {
            if (!error) {
                Session.set('currentgame', null);
                Session.set('state', 'lobby');
            }
        });
    }
});

Template.wait.playerlist = function () {
    var gameid = Session.get('currentgame');
    var game = Games.findOne(gameid);

    if (!game) return [];

    var team1 = game.team1;
    var team2 = game.team2;
    var result = [];
    while (team1.length || team2.length) {
        result.push({
            'user1': team1.shift() || '',
            'user2': team2.shift() || ''
        });
    }

    return result;
};

Template.wait.isgamecreator = function () {
    var gameid = Session.get('currentgame');
    var game = Games.findOne(gameid);

    if (!game) return false;
    return game.gamemaster === Session.get('username');
};

Template.wait.gamenotready = function () {
    var gameid = Session.get('currentgame');
    var game = Games.findOne(gameid);

    if (!game) return true;
    return !(game.team1.length + game.team2.length > 5 && Math.abs(game.team1.length - game.team2.length) < 2);
};

