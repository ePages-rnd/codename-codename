/*global Template, Session, Random*/
/*global $*/
'use strict';
Template.login.events({
    'click button': function () {
        var username = $('#username-input').val() || 'player-' + Random.id();
        Session.set('username', username);
        Session.set('state', 'lobby');

        var position = {
            'lat': 50.927054,
            'long': 11.589237
        };

        Players.insert({
            '_id': username,
            'username': username,
            'position': position
        });
    }
});
