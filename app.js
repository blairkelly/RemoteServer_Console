
var config = require('./config');

console.log("Listening on port " + config.listenport);

var fs = require('fs');
var app = require('express')(),           // start Express framework
  server = require('http').createServer(app), // start an HTTP server
  io_local = require('socket.io').listen(server);

var serialport = require("serialport"),     // include the serialport library
  SerialPort  = serialport.SerialPort,      // make a local instance of serial
  serialData = {};                    // object to hold what goes out to the client

server.listen(config.listenport);

var portName = "/dev/tty.usbmodem1411";           // third word of the command line should be serial port name

var myPort = new SerialPort(portName, { 
  baudrate: 57600,
  // look for return and newline at the end of each data packet:
  parser: serialport.parsers.readline("\r\n") 
});
myPort.on("open", function () {
  console.log('Serial Port Opened');

  myPort.on('data', function (data) {
      serialData.value = data; // set the value property of scores to the serial string:
      console.log(data);
      //socket.emit('serialEvent', serialData);
  });

});



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











// Emit welcome message on connection
io_local.sockets.on('connection', function(socket) {
    var address = socket.handshake.address;
    console.log("Client connected at " + address.address + ":" + address.port);

    socket.emit('welcome', { 
        message: 'Welcome to Server Console',
        address: address.address
    });

});

















function wf(thefile, filecontents) {
    fs.writeFile(thefile, filecontents, function () {
        console.log("Callback: Wrote to file.");
        io.sockets.emit('saved', true);
    });
}