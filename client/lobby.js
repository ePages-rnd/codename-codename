/*global Template, Session, Meteor*/
/*global google*/
/*global Games*/
'use strict';

Template.lobby_menu.events({
    'click #create-game-btn': function () {
        Meteor.call('createGame', {
            'user': Session.get('username'),
            'location': Session.get('currentposition')
        }, function (error, result) {
            if (!error) {
                Session.set('currentgame', result.game);
                Session.set('currentteam', result.team);
                Session.set('state', 'wait');
            }
        });
    },
    'click #search-game-btn': function () {
        Session.set('state', 'search');
    },
    'click #help-btn': function () {
        Session.set('state', 'help');
    },
    'click #settings-btn': function () {
        Session.set('state', 'settings');
    }
});

Template.search.events({
    'click #search-games-table button': function (event) {
        var gameid = event.currentTarget.id;
        var user = Session.get('username');
        Meteor.call('joinGame', {
            'gameid': gameid,
            'user': user
        }, function (error, result) {
            if (!error) {
                Session.set('currentgame', result.game);
                Session.set('currentteam', result.team);
                Games.find(gameid).observe({
                    'changed': function (new_obj, old_obj) {
                        if (new_obj.state === 'playing') {
                            Session.set('state', 'game');
                            Meteor.subscribe('MyTeam', Session.get('currentteam'));
                        }
                    },
                    'removed': function () {
                        Session.set('currentgame', null);
                        Session.set('currentteam', null);
                        Session.set('state', 'lobby');
                    }
                });
                Session.set('state', 'wait');
            }
        });
    }
});

Template.search.games = function () {
    return Games.find({
        'state': 'searching'
    });
};

Template.search.distance = function (origin) {
    if (!google.maps) { return 0; }

    var position = Session.get('currentposition');

    var distance = Spots.distance(position, origin);

    if( distance > 1000) {
        return Math.round( distance / 100 ) / 10 + ' km';
    }
    return Math.round(distance / 10) * 10 + ' m';
};
