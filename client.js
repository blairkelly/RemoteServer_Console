/*
    Ref:

    params.bootstatus = Received Arduino Boot Status
    params.computerpowerstate = Received Computer Power State
    params.actionstatus
        params.actionstatus == 'fpbp' = Finished Power Button Push
    params.rhb= Heartbeat!
*/


var app_socket = io.connect('//'+serverip+':'+serverport);
var serial_socket = app_socket;

app_socket.on('welcome', function(data) {
    console.log(data.message);
    console.log('Handshake address: ' + data.address);
});


//if I just need to issue commands and receive data from a remote serial (i.e. for use during development)
//this might not even be necessary, I'm not sure yet. (still a noob)
if(remote_serial_ip) {
    var remoteserial_socket = io.connect('//'+remote_serial_ip+':'+remote_serial_port);
    serial_socket = remoteserial_socket;
    remoteserial_socket.on('welcome', function(data) {
        console.log("CONNECTED TO REMOTE SERIAL PORT");
    });
}


serial_socket.on('serialParams', function(data) {
	$('.serialParams').html(''); //clear it
	for(key in data) {
		var spit = "<span class='key'>" + key + "</span>: " + data[key] + "<br/>";
		$('.serialParams').append(spit);
	}
});


var serialcmd = function(command) {
	serial_socket.emit('serialCommand', command);
}

$(document).ready(function () {
	$('.pushpowerbutton').on('click', function () {
		serialcmd('p760');
	});
	$('.turnoffcomputer').on('click', function () {
		serialcmd('p5100');
	});
	$('.computerpowerstatus').on('click', function () {
		serialcmd('s1');
	});
});