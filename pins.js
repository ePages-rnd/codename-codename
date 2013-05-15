/*global Meteor, Template, Pins: true*/
Pins = new Meteor.Collection('pins');

if (Meteor.is_client) {
    /*jslint browser: true*/

    //
    // TODO
    // Backbone.Collection?
    //
    Template.main_menu.events = {
        'click #add_pin': function (e) {
            'use strict';

            var map = Template.map.getGoogleMap(),
                center = map.getCenter(),
                marker = new window.google.maps.Marker({
                    position: center,
                    map: map
                });

            Pins.insert({
                x: center.lat(),
                y: center.lng()
            });
        }
    };
}
