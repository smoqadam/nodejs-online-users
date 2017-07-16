var map;
var uid;
var markers = [];
var url = 'http://localhost:3000';
$(function() {
	// google map style made by: https://mapstyle.withgoogle.com/
	var myStyle = [{
		"featureType": "administrative.country",
		"elementType": "geometry.stroke",
		"stylers": [{
			"color": "#bbbbbb"
		}]
	}, {
		"featureType": "administrative.locality",
		"stylers": [{
			"visibility": "off"
		}]
	}, {
		"featureType": "landscape",
		"stylers": [{
			"visibility": "off"
		}]
	}, {
		"featureType": "poi",
		"stylers": [{
			"visibility": "off"
		}]
	}, {
		"featureType": "road",
		"stylers": [{
			"visibility": "off"
		}]
	}, {
		"featureType": "transit",
		"stylers": [{
			"visibility": "off"
		}]
	}];
	/**
	 * google map initialize
	 */
	map = new google.maps.Map(document.getElementById('map'), {
		mapTypeControlOptions: {
			mapTypeIds: ['mystyle']
		},
		center: new google.maps.LatLng(30, 0),
		disableDefaultUI: true,
		zoom: 1,
		mapTypeId: 'mystyle'
	});
	map.mapTypes.set('mystyle', new google.maps.StyledMapType(myStyle, {
		name: 'My Style'
	}));

	// socket initialize
	var socket = io.connect(url, {
		transports: ['websocket', 'xhr-polling']
	});
	$(window).on('beforeunload', function() {
		socket.close();
	});

	// create unique user id
	// stolen from: https://stackoverflow.com/a/105074/1103397
	function guid() {
		function s4() {
			return Math.floor((1 + Math.random()) * 0x10000)
				.toString(16)
				.substring(1);
		}
		return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
			s4() + '-' + s4() + s4() + s4();
	}
	//save user id in localStorage
	if (localStorage.uid == undefined) {
		uid = guid();
		localStorage.setItem('uid', uid);
	} else {
		uid = localStorage.uid;
	}

	// send user id to server!!
	socket.on('connect', function() {
		socket.emit('userConnect', {
			'uid': uid
		});
	});

	//display activities
	socket.on('addActivity', function(msg) {
		$('.activities').append('<span class="activity">' + msg + '</span>');
		console.log('msg');
		console.log(msg);
		$('.activities').animate({
			scrollTop: $('.activities').prop("scrollHeight")
		}, 1000);
	})

	//First remove all markers then add them again. This could be written better.
	socket.on('updateMarkers', function(markers) {
		var count = 0;
		removeMarkers();
		for (marker in markers) {
			count += markers[marker]['sum'];
			addMarker(markers[marker]);
		}
		$('#count').html(count + " online user(s)!");
	})


	function removeMarkers() {
		for (var i = 0; i < markers.length; i++) {
			markers[i].setMap(null);
		}
		markers.length = 0;
	}

	function addMarker(client) {
		var marker = new google.maps.Marker({
			position: new google.maps.LatLng(client['_id']['lat'], client['_id'][
				'lng'
			]),
			title: client['sum'] + ' online user(s)',
			map: map
		});
		marker.setMap(map);
		markers.push(marker);
	}

});
