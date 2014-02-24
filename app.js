
var config = require('./private_config');
var http = require('http');
var ftp_client = require('ftp');

console.log("Listening on port " + config.listenport);

var fs = require('fs');
var app = require('express')(),           // start Express framework
  server = require('http').createServer(app), // start an HTTP server
  io_local = require('socket.io').listen(server);

var serialport = require("serialport"),     // include the serialport library
  SerialPort  = serialport.SerialPort,      // make a local instance of serial
  serialData = {};                    // object to hold what goes out to the client

server.listen(config.listenport);

//SERIAL PORT STUFF
/*
serialport.list(function (err, ports) {
  ports.forEach(function(port) {
    console.log(port.comName);
    console.log(port.pnpId);
    console.log(port.manufacturer);
  });
});
*/

var portName = config.serialport;

var myPort = new SerialPort(portName, { 
  baudrate: 57600,
  // look for return and newline at the end of each data packet:
  parser: serialport.parsers.readline("\r\n") 
});
myPort.on("open", function () {
  console.log('Serial Port Opened');
  get_my_ip();
  myPort.on('data', function (data) {
    
    //serialData.value = data; // set the value property of scores to the serial string:
    console.log("Serialport received: " + data);

    var n = data.split("&");
    var params = {};
    for(var i = 0; i<n.length; i++) {
      params[n[i].substring(0, 1)] = n[i].substring(1, n[i].length);
    }
    
    io_local.sockets.emit('serialEvent', data);

    if(params.bootstatus) {
      console.log("Received Computer Power Status: " + data.bootstatus);
    }

    if(params.rhb) {
      console.log("Received a Heartbeat Request...");
      console.log(data.rhb);
      myPort.write("h1\r");
      get_my_ip();
    }
    
  });

});


//ftp
var upload_sip = function () {
  console.log("Attempting IP upload...");
  var ftp_c = new ftp_client();
  ftp_c.on('ready', function() {
    ftp_c.put('s_ip.txt', 'rsc/'+config.ip_filename, function(err) {
      if (err) throw err;
      ftp_c.end();
      console.log("Successfully uploaded " + config.ip_filename);
    });
    console.log("READY!");
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
  host: 'www.blairkelly.ca',
  port: 80,
  path: '/rsc/my_ip.php'
};
var sip = "ip not set";
var get_my_ip = function () {
  http.get(get_ip_options, function(res) {
    console.log("Server get_ip response: " + res.statusCode);
    res.on("data", function(chunk) {
      sip = chunk;
      wf("s_ip.txt", sip, upload_sip);
      console.log("IP is " + sip);
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

    var address = socket.handshake.address;
    console.log("Client connected at " + address.address + ":" + address.port);

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
        console.log("Wrote to file.");
        //io.sockets.emit('saved', true);
        if(docallback) {
          docallback();
        }
    });
}