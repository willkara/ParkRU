/* 
 * The MIT License
 *
 * Copyright 2014 willkara.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */


$(document).ready(function() {
    $("body").raptorize();

    var lat = 40.50586;
    var lng = -74.45408;
    var localS = localStorage;
    var markerArray = [];

    var permitType;
    var location = null;
    var map;
    var locationJson;
    var lotJson;
    var infoWindow = new google.maps.InfoWindow({});



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


    function addInfoWindow(marker, message) {
        google.maps.event.addListener(marker, 'click', function() {

            infoWindow.setContent("<h3>" + message + "</h3>");
            infoWindow.open(map, marker);
        });
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


    cartodb.createVis('map', 'http://willkara.cartodb.com/api/v2/viz/6bd36920-7c76-11e3-991c-0e49973114de/viz.json').done(function(vis, layers) {
        // layer 0 is the base layer, layer 1 is cartodb layer
        // when setInteraction is disabled featureOver is triggered
        layers[1].setInteraction(true);
        // you can get the native map to work with it
        // depending if you use google maps or leaflet
        map = vis.getNativeMap();
        

        // now, perform any operations you need
        // map.setZoom(3)
        // map.setCenter(new google.maps.Latlng(...))
    });







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