/*global Meteor*/
/*global Template*/
/*global console*/
/*global window*/
/*global document*/

/*global MarkedSpots*/
var map, gmaps;

Meteor.startup(function () {
    var drawn_spots = {};
    var drawn_triangles = {};

    Deps.autorun(function () {
        var spots = MarkedSpots.find().fetch();
        spots.forEach(function (spot) {
            if (!drawn_spots[spot._id]) {
                var marker = new gmaps.Marker({
                    position: new gmaps.LatLng(spot.x, spot.y),
                    map: map
                });
                drawn_spots[spot._id] = spot;
            }
        });
    });
});

if (Meteor.isClient) {
    window.cmiyc = window.cmiyc || {};

    window.cmiyc.initialize = function () {
        gmaps = window.google.maps;

        var mapOptions = {
            center: new gmaps.LatLng(40.77153, -73.97722),
            zoom: 12,
            disableDefaultUI: true,
            mapTypeId: gmaps.MapTypeId.TERRAIN
        };
        map = new gmaps.Map(document.getElementById('map_canvas'), mapOptions);
    };
    Template.main_menu.main_menu_item2_text = 'Create Game';
    Template.main_menu.main_menu_item3_text = 'Search Game';
    Template.main_menu.main_menu_item4_text = 'Help';

    Template.main_menu.events({
        'click #main_menu_item3': function () {
            var center = map.getCenter();


            var marker = new google.maps.Marker({
                position: center,
                map: map
            });

            MarkedSpots.insert({
                'x': center.kb,
                'y': center.lb
            });
        }
    });
}
