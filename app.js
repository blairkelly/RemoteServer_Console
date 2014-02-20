var config = require('./config');

console.log("Listening on port " + config.listenport);

var fs = require('fs');
var app = require('express')(),           // start Express framework
    server = require('http').createServer(app), // start an HTTP server
    io_local = require('socket.io').listen(server);


server.listen(config.listenport);

app.get('/', function (request, response) {
  response.sendfile(__dirname + '/index.html');
});
app.get('/client_config.js', function (request, response) {
  response.sendfile(__dirname + '/client_config.js');
});
app.get('/client.js', function (request, response) {
  response.sendfile(__dirname + '/client.js');
});
app.get('/bootstrap/css/bootstrap.min.css', function (request, response) {
  response.sendfile(__dirname + '/bootstrap/css/bootstrap.min.css');
});
app.get('/style.css', function (request, response) {
  response.sendfile(__dirname + '/style.css');
});
app.get('/jquery/jquery-2.0.3.min.js', function (request, response) {
  response.sendfile(__dirname + '/jquery/jquery-2.0.3.min.js');
});
app.get('/jquery/jquery-2.0.3.min.map', function (request, response) {
  response.sendfile(__dirname + '/jquery/jquery-2.0.3.min.map');
});
app.get('/bootstrap/js/bootstrap.min.js', function (request, response) {
  response.sendfile(__dirname + '/bootstrap/js/bootstrap.min.js');
});

io_local.configure(function(){
  io_local.set('log level', 1);  //tells IO socket to be mostly quiet.
});



function wf(thefile, filecontents) {
    fs.writeFile(thefile, filecontents, function () {
        console.log("Callback: Wrote to file.");
        io.sockets.emit('saved', true);
    });
}


// Emit welcome message on connection
io_local.sockets.on('connection', function(socket) {
    var address = socket.handshake.address;
    console.log("Client connected at " + address.address + ":" + address.port);

    socket.emit('welcome', { 
        message: 'Welcome to Server Console',
        address: address.address
    });

    
});