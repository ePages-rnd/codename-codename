'use strict';


Template.game.events({
    'click #create-spot-btn': function () {
        console.log(Session.get('currentposition'));
    }
});

Template.game.currentposition = function () {
    var pos = Session.get('currentposition');
    return 'lat: ' + pos.lat + ' long: ' + pos.long;
};

var players = {};

var updateMarker = function (player) {

        var map = window.cmiyc.map;
        var marker = players[player._id];

        var position = new google.maps.LatLng(player.position.lat, player.position.long);

        if (!marker) {
            //createMarker
            var marker = new google.maps.Marker({
                position: position,
                map: map
            });

            players[player._id] = marker;
        } else {
            marker.setPosition(position);
        }
    };

Template.game.positionupdate = function () {
    Players.find().forEach(updateMarker);
    return '';
};
