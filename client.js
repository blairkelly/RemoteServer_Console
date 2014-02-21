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
    $('.serialdata').prepend(data.value + "<br/>");
});

$(document).ready(function () {
	$('.pushpowerbutton').on('click', function () {
		socket_remote.emit('push_power_button', '850');
	});
	$('.turnoffcomputer').on('click', function () {
		socket_remote.emit('push_power_button', '5200');
	});
	$('.reportpowerledstatus').on('click', function () {
		socket_remote.emit('report_pwr_led_status', '1');
	});
	$('.dontreportpowerledstatus').on('click', function () {
		socket_remote.emit('report_pwr_led_status', '0');
	});
});