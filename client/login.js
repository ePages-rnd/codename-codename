/*global Template, Session, Random*/
/*global $*/
'use strict';
Template.login.events({
    'click button': function () {
        var username = $('#username-input').val() || 'player-' + Random.id().substring(0,3);
        Session.set('username', username);
        Session.set('state', 'lobby');

        var position = Games.START_POSITION;

        Players.insert({
            '_id': username,
            'username': username,
            'position': position
        });
    }
});
