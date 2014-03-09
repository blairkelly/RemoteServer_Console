/*
    Ref:

    params.bootstatus = Received Arduino Boot Status
    params.computerpowerstate = Received Computer Power State
    params.actionstatus
        params.actionstatus == 'fpbp' = Finished Power Button Push
    params.rhb= Heartbeat!
*/

var window_width = $(window).width();
var window_height = $(window).height();
var app_socket = io.connect('//'+serverip+':'+serverport);
var serial_socket = app_socket;

app_socket.on('welcome', function(data) {
    console.log(data.message);
    console.log('Handshake address: ' + data.address);
});

var ismobile = ((/iphone|ipad|android/gi).test(navigator.appVersion));

var downevent = ismobile ? "touchstart" : "mousedown";
var upevent = ismobile ? "touchend" : "mouseup";
var moveevent = ismobile ? "touchmove" : "mousemove";

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
	$('.computerpowerstatus div').html(''); //clear it
	for(key in data) {
		var spit = "<span class='key'>" + key + "</span>: " + data[key] + "<br/>";
		$('.computerpowerstatus div').append(spit);
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
	$('.button .adjustholder').on('click ' + downevent + ' ' + upevent, function (event) {
		event.preventDefault();
		event.stopPropagation();
	});
	$('.timeadjust.up').on(downevent, function() {
		var delay_div = $('.pushpowerbutton .delay');
		var delay = delay_div.data('val');
		delay = delay + 100;
		delay_div.data('val', delay);
		delay_div.html(delay);
	});
	$('.timeadjust.down').on(downevent, function() {
		var delay_div = $('.pushpowerbutton .delay');
		var delay = delay_div.data('val');
		delay = delay - 50;
		delay_div.data('val', delay);
		delay_div.html(delay);
	});
	$('.powerbutton').on('click', function () {
		var thisbtn = $(this);
		if(thisbtn.hasClass('disabled')) {
			//do nothing
		} else {
			if(thisbtn.hasClass('pushpowerbutton')) {
				var delay_div = $(this).find('.delay');
				var delay = delay_div.data('val');
				serialcmd('p'+delay);
			} else if(thisbtn.hasClass('turnoffcomputer')) {
				serialcmd('p5100');
			}
			$('.powerbutton').removeClass('enabled').addClass('disabled');
		}
	});
	$('.computerpowerstatus').on('click', function () {
		serialcmd('s1');
	});
});

var button_cover = $('.button_cover');
button_cover.data('removed', false);
var button_cover_move_event = function (event) {
	event = event.originalEvent;
	event.preventDefault();
	event.stopPropagation();
	var point = event.touches ? event.touches[0] : event;
	var pX = point.pageX;
	var startX = button_cover.data('mstart');
	var difference = pX - startX;
	//$(this).html(difference);
	var minslide = button_cover.outerWidth() * 0.666;
	var originalx = button_cover.data('originalx');
	if(difference >= 0) {
		button_cover.css('left', (originalx+difference)+'px');
		if((difference > minslide) && !button_cover.data('removed')) {
			button_cover.data('removed', true);
			button_cover.fadeTo(120, 0, function () {
				button_cover.hide();
				button_cover.css('left', originalx+'px');
				button_cover.off(moveevent, button_cover_move_event);
			});
			setTimeout(function () {
				button_cover.fadeTo(100, 1, function () {
					button_cover.data('removed', false);
					//$('body').append('crinkle<br/>').css('color', 'white');
				});
			}, 15000);
		}
	}
}
button_cover.on(downevent, function (event) {
	event = event.originalEvent;
	event.preventDefault();
	event.stopPropagation();
	var point = event.touches ? event.touches[0] : event;
	var pX = point.pageX;
	$(this).data('mstart', pX);
	button_cover.on(moveevent, button_cover_move_event);
});
button_cover.on(upevent, function (event) {
	event = event.originalEvent;
	event.stopPropagation();
	if(!button_cover.data('removed')) {
		var originalx = button_cover.data('originalx');
		button_cover.css('left', originalx+'px');
		button_cover.off(moveevent, button_cover_move_event);
	}
});


var do_resize = function () {
	var container = $('.container');
	window_width = $(window).width();
	window_height = $(window).height();
	var referencewidth = 768;
	if(window.devicePixelRatio > 1) {
		referencewidth = 1000;
	}
	if(window_width <= referencewidth) {
		var padding = (window_height * 0.02) + 'px';
		var buttonheight = ((window_height * .96) / 3) + 'px';
		container.css('height', window_height + 'px').css('padding-top', padding);
		$('.button').css('height', buttonheight);
	} else {
		var attr = container.attr('style');
		if(typeof attr !== 'undefined' && attr !== false) {
			container.removeAttr('style');
			$('.button').removeAttr('style');
		}
	}
	var button_top = $('.pushpowerbutton').position().top;
	var button_left = $('.pushpowerbutton').position().left;
	var cover_height = $('.turnoffcomputer').position().top - button_top + $('.turnoffcomputer').outerHeight();
	button_cover.css('top', button_top + 'px').css('left', button_left + 'px').css('height', cover_height + 'px').css('width', $('.pushpowerbutton').outerWidth() + 'px');
	button_cover.data('originalx', button_left);
	var powerbutton = $('.pushpowerbutton');
	var pb_vd = powerbutton.find('.delay');
	var pb_vd_val = pb_vd.data('val');
	pb_vd.html(pb_vd_val);
	var pb_vd_height = pb_vd.outerHeight();
	var buttoncurrentheight = $('.button').outerHeight();
	var pb_vd_top = (buttoncurrentheight - pb_vd_height) / 2;
	pb_vd.css('top', pb_vd_top + 'px');
	$('.timeadjust').css('height', buttoncurrentheight + 'px');
}
$(window).on('resize', function () {
	do_resize();
});
do_resize();
button_cover.removeClass('hidden');