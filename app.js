
var config = require('./private_config');
var http = require('http');
var ftp_client = require('ftp');

var fs = require('fs');
var app = require('express')(),           // start Express framework
  server = require('http').createServer(app), // start an HTTP server
  io_local = require('socket.io').listen(server);

var serialport = require("serialport"),     // include the serialport library
  SerialPort  = serialport.SerialPort,      // make a local instance of serial
  serialData = {};                    // object to hold what goes out to the client

server.listen(config.listenport);

//SERIAL PORT STUFF
var portName = config.serialport;

var myPort = new SerialPort(portName, { 
  baudrate: 57600,
  // look for return and newline at the end of each data packet:
  parser: serialport.parsers.readline("\r\n") 
});
myPort.on("open", function () {
  var message = null;
  get_my_ip();
  myPort.on('data', function (data) {

    var pairs = data.split('&');
    var pieces = null;
    var params = {};
    for(var i = 0; i<pairs.length; i++) {
      pieces = pairs[i].split('=');
      params[pieces[0]] = pieces[1];
    }
    
    for(key in params) {
      //log(key) = key name
      //params[key] = key value
    }

    if(params.bootstatus) {
      message = "Received Arduino Boot Status: " + params.bootstatus;
      io_local.sockets.emit('serialEvent', message);
    }
    if(params.computerpowerstate) {
      message = "Received Computer Power State: " + params.computerpowerstate;
      io_local.sockets.emit('serialEvent', message);
    }

    if(params.rhb) {
      io_local.sockets.emit('serialEvent', "Heartbeat!");
      myPort.write("h1\r");
      get_my_ip();
    }
  });

});


//ftp
var upload_sip = function () {
  var newdate = new Date();
  var ftp_c = new ftp_client();
  ftp_c.on('ready', function() {
    ftp_c.put('ip.txt', 'rsc/'+config.ip_filename, function(err) {
      if (err) throw err;
      ftp_c.end();
      console.log("Updated IP file on Server @ " + newdate);
    });
  });
  var ftp_connect_options = {
    host: config.ftp_address,
    user: config.ftp_user,
    password: config.ftp_pass
  };
  ftp_c.connect(ftp_connect_options);
}
//ip stuff
var get_ip_options = {
  host: config.get_ip_host,
  port: config.get_ip_port,
  path: config.get_ip_path
};
var sip = "ip not set";
var get_my_ip = function () {
  http.get(get_ip_options, function(res) {
    res.on("data", function(chunk) {
      sip = chunk;
      wf("ip.txt", sip, upload_sip);
    });
  }).on('error', function(e) {
      console.log("get server ip ERROR: " + e.message);
  });
}






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
    var newdate = new Date();
    var address = socket.handshake.address;

    console.log("Client: " + address.address + ":" + address.port + " @ " + newdate);

    socket.emit('welcome', { 
        message: 'Welcome to Server Console',
        address: address.address
    });

    socket.on('push_power_button', function(time) {
        myPort.write("p"+time+"\r");
    });
    socket.on('report_pwr_led_status', function(bool_switch) {
        myPort.write("f"+bool_switch+"\r");
    });
    socket.on('s', function(bool_switch) {
        myPort.write("s"+bool_switch+"\r");
    });

});
      
      



function wf(thefile, filecontents, docallback) {
    fs.writeFile(thefile, filecontents, function () {
        if(docallback) {
          docallback();
        }
    });
}