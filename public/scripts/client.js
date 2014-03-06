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
if( typeof remote_serial_ip === 'undefined' ) {
    console.log("remote serial ip is undefined");
} else {
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
	if(data.computerpowerstate) {
		$('body').removeClass().addClass(data.computerpowerstate);
	}
});
serial_socket.on('appParams', function(data) {
	if(data.pbstatus) {
		if(data.pbstatus == "enabled") {
			$('.pushpowerbutton,.turnoffcomputer').removeClass('disabled').addClass('enabled');
		} else {
			$('.powerbutton').removeClass('enabled').addClass('disabled');
		}
	}
});

var serialcmd = function(command) {
	serial_socket.emit('serialCommand', command);
}

$(document).ready(function () {
	$('.powerbutton').on('click', function () {
		var thisbtn = $(this);
		$('.powerbutton').removeClass('enabled').addClass('disabled');
		if(thisbtn.hasClass('pushpowerbutton')) {
			if(thisbtn.hasClass('disabled')) {
				//do nothing
			} else {
				//serialcmd('p760');
			}
		} else if(thisbtn.hasClass('turnoffcomputer')) {
			if(thisbtn.hasClass('disabled')) {
				//do nothing
			} else {
				//serialcmd('p5100');
			}
		}
	});
	$('.computerpowerstatus').on('click', function () {
		serialcmd('s1');
	});
});