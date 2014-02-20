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
        address: address.address,
        basepathremote: config.bpr,
        filestowatch: config.filestowatch
    });

    socket.on('filechange', function(data) {
        console.log("changed file (as sent from server): " + data.changedfile);
        var modified_file_location = config.bpr + data.changedfile.substring(config.bpl.length, data.changedfile.length);
        if (  modified_file_location.match(/\\/)  ) {
            //path contains a backslash. replace any existing forward slashes with backslashes.
            modified_file_location = modified_file_location.replace(/\//g, '\\');
        }
        console.log("modified_file_location: " + modified_file_location);
        wf(modified_file_location, data.filecontents);
	});
});