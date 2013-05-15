/*globals Meteor, Template, Deps, $, Pins*/

if (Meteor.is_client) {
    /*jslint browser: true, nomen: true*/

    var map, // Reference to the `google.maps` instance.
        pins = [], // Array of `google.maps.Marker` instances on the `map`.
        mapNode, // Reference to the `#map` node.
        initMap = function () {
            'use strict';
            var gmaps = window.google.maps,
                options = {
                    center: new gmaps.LatLng(40.77153, -73.97722),
                    zoom: 12,
                    disableDefaultUI: true,
                    mapTypeId: gmaps.MapTypeId.TERRAIN
                };

            // Create map.
            map = new gmaps.Map(mapNode, options);

            // Init `Pins` on map.
            Pins.find().observe({
                added: function (pin) {
                    var marker = new gmaps.Marker({
                        position: new gmaps.LatLng(pin.x, pin.y),
                        map: map
                    });

                    marker.setDraggable(true);
                    gmaps.event.addListener(marker, 'dragend', $.proxy(function () {
                        var position = this.marker.position;

                        Pins.update(this.pin_id, {
                            $set: {
                                x: position.lat(),
                                y: position.lng()
                            }
                        });
                    }, {
                        marker: marker,
                        pin_id: pin._id
                    }));

                    pins.push(marker);
                },
                changed: function (new_pin, old_pin) {
                    // TODO
                },
                removed: function (olddoc) {
                    // TODO
                }
            });

        };

    Template.map.rendered = function () {
        'use strict';

        mapNode = this.find('#map');


        // Define `Template.map.helper` to be able to access
        // `google.maps` instance later.
        Template.map.getGoogleMap = function () {
            return map;
        };

        // Load maps API from google.
        $.ajax({
            url: 'https://www.google.com/jsapi',
            dataType: 'script',
            cache: true
        }).done(function () {
            // Load Google Maps API.
            window.google.load('maps', '3', {
                other_params: 'sensor=false',
                callback: initMap
            });

        });

    };
}
