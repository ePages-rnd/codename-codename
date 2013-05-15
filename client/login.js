/*global Template, Session*/
Template.login.events({
    'click button': function () {
        var username = $('#username-input').val() || 'player-' + Random.id();
        Session.set('username', username);
        Session.set('state', 'lobby');
    }
});
