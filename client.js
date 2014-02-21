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
});

$(document).ready(function () {
	$('.executecommand').on('click', function () {
		socket_remote.emit('executecommand', 'push_power_button');
	});
});