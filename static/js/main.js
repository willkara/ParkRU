$(document).ready(function() {
    var permitType;
    var location = null;
    var map;
    var markerArray = [];
    var locationJson;
    var lotJson;
    var infoWindow;
    var localS = localStorage;


    if (localS && localS.getItem("locationjson") !== null) {
        locationJson = $.parseJSON(localS.getItem("locationjson"));
    } else {
        locationJson = getJSON("newLocations.json");
        localS.setItem("locationjson", JSON.stringify(locationJson));
    }

    if (localS && localS.getItem("lotsjson") !== null) {
        lotJson = $.parseJSON(localS.getItem("lotsjson"));
    } else {
        lotJson = getJSON("newLots.json");
        localS.setItem("lotsjson", JSON.stringify(lotJson));
    }
    $('.dropdown-menu > li').click(function(e) {
        eraseMarkers();
        e.preventDefault();
        permitType = ($(this).text());
        //  if (location !== null) {
        generateLocationData(location, permitType);
        //  } else {
        //     lotPermitGenerate(permitType);
        // }
        $("body, html").animate({
            scrollTop: $('.row').offset().bottom
        }, 600);

        //location = null;
        //timeFormat();
    });
    /*
     function lotPermitGenerate(permType) {
     eraseMarkers();
     $.each(lotJson.Lots.Lot, function(i, data) {
     if (data.Permits.indexOf(permType) >= -1) {
     var latlong = new google.maps.LatLng(parseFloat(data.LotLat), parseFloat(data.LotLong));
     createMarker(latlong, data.LotName, "lot", data.LotAddress);
     console.log(data.LotName + " " + i);
     }
     });
     }*/

    function permitTimer(timePeriod) {
        var myDate = new Date();
        var hour = myDate.getHours();
        var currentTimePeriod;
        var result = false;
        if (hour >= 2 && hour <= 18) {
            currentTimePeriod = 1;
        }
        if (timePeriod === currentTimePeriod) {
            result = true;
        }

        return result;


    }
    function initialize() {
        var mapOptions = {
            zoom: 12,
            center: new google.maps.LatLng(40.4946895, -74.4442781),
            mapTypeId: google.maps.MapTypeId.HYBRID
        };

        infoWindow = new google.maps.InfoWindow({});
        google.maps.visualRefresh = true;
        map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
    }

    google.maps.event.addDomListener(window, 'load', initialize);







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
    $(".typeahead").typeahead({
        name: "Locations",
        prefetch: "static/data/locationList.json",
        limit: 20
    });
    $(".typeahead.input-sm").siblings("input.tt-hint").addClass("hint-small");
    $(".typeahead.input-lg").siblings("input.tt-hint").addClass("hint-large");
    $(".typeahead").bind("typeahead:selected", function(e, t) {
        location = (t.value);
        generateLocationData(location, null);

    });


    function generateLotData(lotter, per) {
        $.each(lotter.LocationLotList, function(index, value) {
            $.each(lotJson.Lots.Lot, function(ind, val) {
                if (val.LotName === value) {
                    var latlong = new google.maps.LatLng(parseFloat(val.LotLat), parseFloat(val.LotLong));
                    //$('#lotData').append("<div class='panel panel-default'><div class='panel-heading'>Panel heading without title</div><div class='panel-body'>Panel content</div></div>");
                    createMarker(latlong, val.LotName, 'lot', val.LotAddress, val.Permits, val.TimeGroup);
                }
            });
        });

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


    //TO-DO: Make this function more dynamica so that it can just accept different data types instead of 13424523423423 different arguments
    function createMarker(coords, name, type, addr, per, time) {
        var marker = new google.maps.Marker({
            position: coords,
            map: map,
            title: name,
            animation: google.maps.Animation.DROP
        });

        if (type === 'loc') {
            marker.setIcon('static/img/red-dot.png');

            addInfoWindow(marker, name);
        }
        else if (type === 'lot') {
            marker.setIcon('static/img/green-dot.png');
            var mess;
            if (addr === "Address Not Available") {
                addr = coords.toUrlValue(5);
            }

            mess = "<h3>" + name + "</h3><p>" + addr + "</p><strong>Lots that can park here: </strong>" + per + "<p><strong>Known allowed parking time: </strong>" + time + "</p>";
            addInfoWindow(marker, mess);
        }
        markerArray.push(marker);

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
                $('body').css('bgcolor', 'black !important');        //Yo' defaults

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