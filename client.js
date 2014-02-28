var app_socket = io.connect('//'+serverip+':'+serverport);

app_socket.on('welcome', function(data) {
    console.log(data.message);
    console.log('Handshake address: ' + data.address);
});

app_socket.on('serialParams', function(data) {
	$('.serialParams').html(''); //clear it
	for(key in data) {
		var spit = "<span class='key'>" + key + "</span>: " + data[key] + "<br/>";
		$('.serialParams').append(spit);
	}
});

var serialcmd = function(command) {
	app_socket.emit('serialCommand', command);
}

$(document).ready(function () {
	$('.pushpowerbutton').on('click', function () {
		serialcmd('p950');
	});
	$('.turnoffcomputer').on('click', function () {
		serialcmd('p5100');
	});
	$('.computerpowerstatus').on('click', function () {
		serialcmd('s1');
	});
});


	/*

	APP.js

	socket.on('push_power_button', function(time) {
        sendserialcommand("p"+time);
    });
    socket.on('report_pwr_led_status', function(bool_switch) {
        sendserialcommand("f"+bool_switch);
    });
    socket.on('s', function(bool_switch) {
        sendserialcommand("s"+bool_switch);
    });

	*/



	/*

	CLIENT js

    if(params.bootstatus) {
        message = "Received Arduino Boot Status: " + params.bootstatus;
        io_local.sockets.emit('serialEvent', message);
    }

    if(params.computerpowerstate) {
        message = "Received Computer Power State: " + params.computerpowerstate;
        io_local.sockets.emit('serialEvent', message);
    }

    if(params.actionstatus) {
        if(params.actionstatus == 'fpbp') {
          //finished power button push.
          message = "Finished Power Button Push";
          io_local.sockets.emit('serialEvent', message);
        }
    }

    if(params.rhb) {
        io_local.sockets.emit('serialEvent', "Heartbeat!");
        myPort.write("h1\r");
        get_my_ip();
    }

    */
