var locationhostname = window.location.hostname;
var serverip = locationhostname;

var locationport = window.location.port;
var serverport = locationport;

var socket_remote = io.connect('//'+remote_machine_address+':'+remote_machine_port);
socket_remote.on('welcome', function(data) {
    console.log("Connected remote");
    console.log(data.message);
    console.log('Handshake address: ' + data.address);
});