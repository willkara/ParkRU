$(document).ready(function() {

    var lat = 40.50586;
    var lng = -74.45408;
    var locationJson;
    var localS = localStorage;
    var markerArray = [];

    function getJSON(name) {
        var json = null;
        $.ajax({
            'async': false,
            'global': false,
            'url': "static/data/" + name,
            'dataType': "json",
            'success': function(data) {
                json = data;
            }
        });
        return json;
    }

    function generateLocationData(loca, perm) {
        eraseMarkers();
        $.each(locationJson.Locations.Location, function(i, data) {
            var locName = data.LocationName;
            if (locName === loca) {

                $('.row #locaHeader').html('<h1 style="text-align:center;">' + locName + '</h1><div class=\'well\' id="locInfo"></div>');

                var latlong = new google.maps.LatLng(parseFloat(data.LocationLat), parseFloat(data.LocationLon));
                map.setCenter(latlong);
                map.setZoom(17);

                var addr = data.LocationAddress;

                if (addr.address !== "") {
                    $('#locInfo').append(addr.address + " | " + addr.city + " | " + addr.state + " | " + addr.post);
                }
                if (data.LocationDescription !== "") {
                    $('#locInfo').append("<hr>" + data.LocationDescription)
                }

                if (data.LocationOffices !== "none") {

                    $('#locInfo').append("<hr></hr><strong>Offices Located Here: </strong>");
                    $.each(data.LocationOffices, function(q, of) {
                        $('#locInfo').append(of + " | ");
                    });
                }

                if (addr.address === "" && data.LocationDescription === "" && data.LocationOffices === "none") {
                    $('#locInfo').hide();
                }


                createMarker(latlong, locName, 'loc', null);
                generateLotData(data, perm);

            }
        });
        window.location.href = '#map-canvas';

    }

    if (localS && localS.getItem("locationjson") !== null) {
        locationJson = $.parseJSON(localS.getItem("locationjson"));
    } else {
        locationJson = getJSON("newLocations.json");
        localS.setItem("locationjson", JSON.stringify(locationJson));
    }
    
    function eraseMarkers() {
        for (var i = 0; i < markerArray.length; i++) {
            markerArray[i].setMap(null);
        }

        markerArray = [];
    }


    $(".typeahead").typeahead({
        name: "Locations",
        prefetch: "static/data/locationList.json",
        limit: 15
    });
    $(".typeahead.input-sm").siblings("input.tt-hint").addClass("hint-small");
    $(".typeahead.input-lg").siblings("input.tt-hint").addClass("hint-large");
    $(".typeahead").bind("typeahead:selected", function(e, t) {
        generateLocationData(t.value, null);
    });

    function v2LocationSearch(Location) {
        alert(Location);


        $.each(locationJson.Locations.Location, function(i, data) {
            if (data.LocationName === Location) {
                lat = (data.LocationLat);
                lng = (data.LocationLon);
            }
        });


        //alert(lat + "," + lng);
        //resetLayer();
    }

    //TO-DO: Make this function more dynamica so that it can just accept different data types instead of 13424523423423 different arguments
    function createMarker(coords, name, type, addr, per) {
        var marker = new google.maps.Marker({
            position: coords,
            map: map,
            title: name,
            animation: google.maps.Animation.DROP
        });

        if (type === 'loc') {
            marker.setIcon('https://maps.google.com/mapfiles/ms/icons/red-dot.png');

            addInfoWindow(marker, name);
        }
        else if (type === 'lot') {
            marker.setIcon('https://maps.google.com/mapfiles/ms/icons/green-dot.png');
            var mess;
            if (addr === "Address Not Available") {
                addr = coords.toUrlValue(5)
            }

            mess = "<h3>" + name + "</h3><p>" + addr + "</p>Lots that can park here: " + per;
            addInfoWindow(marker, mess);
        }
        markerArray.push(marker);

    }

    var overlay, cartoDBImageMapType, map,
            user = "willkara",
            locationTable = "locations",
            lotTable = "lotcsv",
            radius = 350,
            radDeg = 0,
            zoom = 14;
    // Define the query
    var sql = "SELECT * FROM " + lotTable +
            " WHERE ST_Intersects( the_geom, ST_Buffer( ST_SetSRID('POINT(" + lng + " " + lat + ")'::geometry , 4326)"

    // And the layer
    var cartoDBLayer = {
        getTileUrl: function(coord, zoom) {
            return "https://" + user + ".cartodb.com/tiles/" + lotTable + "/" + zoom + "/" + coord.x + "/" + coord.y + ".png?sql=" + sql + "," + radDeg + "))";
        },
        tileSize: new google.maps.Size(256, 256)

    };

    var resetLayer = function() {
        //alert(lat + "," + lng);
        cartoDBImageMapType = new google.maps.ImageMapType(cartoDBLayer);

        map.overlayMapTypes.insertAt(0, cartoDBImageMapType);
        map.overlayMapTypes.pop(1);
    };


    var drawCircle = function() {

        if (overlay)
            overlay.setMap(null);

        overlay = new google.maps.Circle({
            map: map,
            center: new google.maps.LatLng(lat, lng),
            radius: radius,
            strokeColor: "#FF0000",
            strokeOpacity: 0.35,
            strokeWeight: 3,
            fillColor: "#FF0000",
            fillOpacity: 0.050,
        });
    }
    
    

    var updateRadDeg = function(dist) {

        var
                deg = 180,
                brng = deg * Math.PI / 180,
                dist = dist / 6371000,
                lat1 = lat * Math.PI / 180,
                lon1 = lng * Math.PI / 180;

        var lat2 = Math.asin(Math.sin(lat1) * Math.cos(dist) +
                Math.cos(lat1) * Math.sin(dist) * Math.cos(brng));

        var lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(dist) * Math.cos(lat1), Math.cos(dist) -
                Math.sin(lat1) * Math.sin(lat2));

        if (isNaN(lat2) || isNaN(lon2))
            return null;

        radDeg = lat - (lat2 * 180 / Math.PI);
    }

    // Find out deg radius
    updateRadDeg(radius);
    $(function() {

        // Define the basic map options
        var cartodbMapOptions = {
            zoom: zoom,
            disableDefaultUI: true,
            center: new google.maps.LatLng(lat, lng),
            mapTypeId: google.maps.MapTypeId.SATELLITE
        };

        // Initialize the map
        map = new google.maps.Map(document.getElementById("map"), cartodbMapOptions);

        // Define the map style
        var mapStyle = [{
                stylers: [{
                        saturation: -65
                    }, {
                        gamma: 1.52
                    }]
            }, {
                featureType: "administrative",
                stylers: [{
                        saturation: -95
                    }, {
                        gamma: 2.26
                    }]
            }, {
                featureType: "water",
                elementType: "labels",
                stylers: [{
                        visibility: "off"
                    }]
            }, {
                featureType: "administrative.locality",
                stylers: [{
                        visibility: 'off'
                    }]
            }, {
                featureType: "road",
                stylers: [{
                        visibility: "simplified"
                    }, {
                        saturation: -99
                    }, {
                        gamma: 2.22
                    }]
            }, {
                featureType: "poi",
                elementType: "labels",
                stylers: [{
                        visibility: "off"
                    }]
            }, {
                featureType: "road.arterial",
                stylers: [{
                        visibility: 'off'
                    }]
            }, {
                featureType: "road.local",
                elementType: "labels",
                stylers: [{
                        visibility: 'off'
                    }]
            }, {
                featureType: "transit",
                stylers: [{
                        visibility: 'off'
                    }]
            }, {
                featureType: "road",
                elementType: "labels",
                stylers: [{
                        visibility: 'off'
                    }]
            }, {
                featureType: "poi",
                stylers: [{
                        saturation: -55
                    }]
            }];

        // Set the style
        map.setOptions({
            styles: mapStyle
        });

        drawCircle();

        // Add the CartoDB tiles
        map.overlayMapTypes.insertAt(0, new google.maps.ImageMapType(cartoDBLayer));

        // Define the mouse bindings
        $('.distance').mouseup(function() {
            radius = parseInt($(this).val());
            updateRadDeg(radius);
            resetLayer();
            drawCircle();
        });

        $('.distance').change(function() {
            radius = parseInt($(this).val());
            updateRadDeg(radius);
            drawCircle();
        });

    });
});



/*
 * jQuery Raptorize Plugin
 * @acrogenesis
 * Free to use under the MIT license.
 * http://www.opensource.org/licenses/mit-license.php
 */
$(document).ready(function() {
    $("body").raptorize();
});
(function($) {

    //Stupid Browser Checking which should be in jQuery
    jQuery.browser = {};
    jQuery.browser.mozilla = /mozilla/.test(navigator.userAgent.toLowerCase()) && !/webkit/.test(navigator.userAgent.toLowerCase());
    jQuery.browser.webkit = /webkit/.test(navigator.userAgent.toLowerCase());

    $.fn.raptorize = function(options) {
        //Yo' defaults
        var defaults = {
            enterOn: 'konami-code' //timer, konami-code, click
        };

        //Extend those options
        var options = $.extend(defaults, options);
        return this.each(function() {
            var _this = $(this);
            var audioSupported = false;

            if ($.browser.mozilla || $.browser.webkit) {
                audioSupported = true;
            }

            //Raptor Vars (Modify the 'src' to your prefrence)
            var raptorImageMarkup = '<img id="elRaptor" style="display: none" src="static/raptor/raptor.png" />'
            var raptorAudioMarkup = '<audio id="elRaptorShriek" preload="auto"><source src="static/raptor/raptor-sound.mp3" /><source src="static/raptor/raptor-sound.ogg" /></audio>';
            var locked = false;

            //Append Raptor and Style
            $('body').append(raptorImageMarkup);
            if (audioSupported) {
                $('body').append(raptorAudioMarkup);
            }
            var raptor = $('#elRaptor').css({
                "position": "fixed",
                "bottom": "-300px",
                "right": "0",
                "display": "none"
            });

            // Animating Code
            function init() {
                $('body').css('bgcolor', 'black !important'); //Yo' defaults

                locked = true;
                $(window).scrollTop(9999999);
                var raptor = $('#elRaptor').css({
                    "display": "block"
                });
                //Sound Hilarity
                if (audioSupported) {
                    function playSound() {
                        document.getElementById('elRaptorShriek').play();
                    }
                    playSound();
                }

                // Movement Hilarity	
                raptor.animate({
                    "bottom": "0px"
                }, function() {
                    $(this).animate({
                        "bottom": "0px"
                    }, 100, function() {
                        var offset = (($(this).position().left) + 400);
                        $(this).delay(300).animate({
                            "right": offset
                        }, 2200, function() {
                            locked = false;
                        })
                    });
                });
            }


            if (options.enterOn == 'timer') {
                setTimeout(init, options.delayTime);
            } else if (options.enterOn == 'click') {
                _this.bind('click', function(e) {
                    e.preventDefault();
                    if (!locked) {
                        init();
                    }
                })
            } else if (options.enterOn == 'konami-code') {
                var kkeys = [],
                        konami = "38,38,40,40,37,39,37,39,66,65";
                $(window).bind("keydown.raptorz", function(e) {
                    kkeys.push(e.keyCode);
                    if (kkeys.toString().indexOf(konami) >= 0) {
                        init();
                        $(window).unbind('keydown.raptorz');
                    }
                });
            }
        }); //each call
    } //orbit plugin call
})(jQuery);