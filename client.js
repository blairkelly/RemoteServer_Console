var locationhostname = window.location.hostname;
var serverip = locationhostname;

var locationport = window.location.port;
var serverport = locationport;

var socket_remote = io.connect('//'+serverip+':'+serverport);
socket_remote.on('welcome', function(data) {
    console.log(data.message);
    console.log('Handshake address: ' + data.address);
});
socket_remote.on('serialEvent', function(data) {
    console.log(data);
    $('.serialdata').prepend(data + "<br/>");
});
socket_remote.on('serialParams', function(data) {
	$('.serialParams').html(''); //clear it
	for(key in data) {
		var spit = "<span class='key'>" + key + "</span>: " + data[key] + "<br/>";
		$('.serialParams').append(spit);
	}
});
$(document).ready(function () {
	$('.pushpowerbutton').on('click', function () {
		socket_remote.emit('push_power_button', '950');
	});
	$('.turnoffcomputer').on('click', function () {
		socket_remote.emit('push_power_button', '5100');
	});
	$('.reportpowerledstatus').on('click', function () {
		socket_remote.emit('report_pwr_led_status', '1');
	});
	$('.dontreportpowerledstatus').on('click', function () {
		socket_remote.emit('report_pwr_led_status', '0');
	});
	$('.computerpowerstatus').on('click', function () {
		socket_remote.emit('s', '1');
	});
});