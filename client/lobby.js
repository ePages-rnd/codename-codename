/*global Template, Session, Meteor*/
Template.lobby_menu.events({
    'click #create-game-btn': function () {
        Meteor.call('createGame', {
            'user': Session.get('username'),
            'location': Session.get('currentposition')
        }, function (error, game) {
            if (!error) {
                Session.set('currentgame', game);
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
        }, function (error, game) {
            if (!error) {
                Session.set('currentgame', gameid);
                Games.find(gameid).observe({
                    'changed': function (new_obj, old_obj) {
                        if (new_obj.state === 'playing') {
                            Session.set('state', 'game');
                        }
                    },
                    'removed': function () {
                        Session.set('currentgame', null);
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
}

Template.search.distance = function (origin) {
    if (!google.maps) { return 0; }

    var positon = Session.get('currentposition');

    var to = new google.maps.LatLng(positon.lat, positon.long);
    var from = new google.maps.LatLng(origin.lat, origin.long);

    var distance = google.maps.geometry.spherical.computeDistanceBetween(from, to);

    if( distance > 1000) return Math.round( distance / 100 ) / 10 + ' km';
    return Math.round(distance / 10) * 10 + ' m';
}
