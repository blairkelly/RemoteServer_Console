var config = require('./config');

var fs = require('fs');
var app = require('express')();           // start Express framework
var server = require('http').createServer(app); // start an HTTP server
var io = require('socket.io').listen(config.remotemachinelisteningport);


io.configure(function(){
  io.set('log level', 1);  //tells IO socket to be mostly quiet.
});

function wf(thefile, filecontents) {
    fs.writeFile(thefile, filecontents, function () {
        console.log("Callback: Wrote to file.");
        io.sockets.emit('saved', true);
    });
}

// Emit welcome message on connection
io.sockets.on('connection', function(socket) {
    var address = socket.handshake.address;
    console.log("Client connected at " + address.address + ":" + address.port);

    socket.emit('welcome', { 
        message: 'HELLO FROM REMOTE',
        address: address.address
    });

    socket.on('squit', function(data) {
       //nargo
	});
});