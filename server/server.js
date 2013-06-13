/*global Meteor*/

/*global Games, Players, Teams, Spots*/
'use strict';
Meteor.publish('AvailableGames', function (currentgame) {
    return Games.find({
        $or: [{
            '_id': currentgame
        }, {
            'state': 'searching'
        }]
    });
});

Meteor.publish('CurrentGameTeams', function (gameid) {
    var game = Games.findOne(gameid);
    if (!game) {
        return;
    }
    return Teams.find({
        $or: [{
            '_id': game.team1
        }, {
            '_id': game.team2
        }]
    });
});

Meteor.publish('MyTeam', function (teamid) {
    var team = Teams.findOne(teamid);
    if (!team) {
        return;
    }

    return Players.find({
        '_id': {
            $in: team.players
        }
    });
});

Meteor.publish('GameSpots', function (gameid) {
    var game = Games.findOne(gameid);
    if (!game) {
        return;
    }

    return Spots.find({
        $or: [{
            'team': game.team1
        }, {
            'team': game.team2
        }]
    });
});

Meteor.publish('GameAreas', function (gameid) {
    var game = Games.findOne(gameid);
    if (!game) {
        return;
    }

    return Areas.find({
        $or: [{
            'team': game.team1
        }, {
            'team': game.team2
        }]
    });
});


