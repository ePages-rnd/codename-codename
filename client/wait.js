/*global Template, Session, Meteor*/
/*global Games, Teams*/
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
        var teamid = Session.get('currentteam');
        if (!gameid) {
            Meteor.Error(413, 'no game selected');
        }

        var user = Session.get('username');
        Meteor.call('leaveGame', {
            'gameid': gameid,
            'teamid': teamid,
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

    if (!game) {
        return [];
    }

    var team1_id = game.team1;
    var team2_id = game.team2;

    var team1 = Teams.findOne(team1_id);
    var team2 = Teams.findOne(team2_id);

    if(!team1 || !team2) {
        return [];
    }

    var result = [];
    while (team1.players.length || team2.players.length) {
        result.push({
            'user1': team1.players.shift() || '',
            'user2': team2.players.shift() || ''
        });
    }

    return result;
};

Template.wait.isgamecreator = function () {
    var gameid = Session.get('currentgame');
    var game = Games.findOne(gameid);

    if (!game) {
        return false;
    }
    return game.gamemaster === Session.get('username');
};

Template.wait.gamenotready = function () {
    var gameid = Session.get('currentgame');
    var game = Games.findOne(gameid);

    if (!game) {
        return true;
    }
    return !(game.team1.length + game.team2.length > 5 && Math.abs(game.team1.length - game.team2.length) < 2);
};
