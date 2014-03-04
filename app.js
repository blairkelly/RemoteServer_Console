console.log(' ');
console.log(' ');
console.log('Remote Server Console. Starting...');

var config = require('./private_config');
var http = require('http');
var ftp_client = require('ftp');

var fs = require('fs');
var app = require('express')(),           // start Express framework
  server = require('http').createServer(app), // start an HTTP server
  io_local = require('socket.io').listen(server);

var jade = require('jade');
var sass = require('node-sass');
var old_css_mtime = null;

var view_data = {
  cps: "off"
}

console.log(' ');

var serialport = require("serialport"),     // include the serialport library
  SerialPort  = serialport.SerialPort,      // make a local instance of serial
  serialData = {};                    // object to hold what goes out to the client

server.listen(config.listenport);


//SERIAL PORT STUFF
var portName = config.serialport;
var sendserialcommand = function (instruction) {
  var thecommand = instruction + "\r";
  if(config.remoteserial) {
    //do nothing
    console.log("sent to remote serial: " + thecommand);
  } else {
    console.log(thecommand);
    myPort.write(thecommand);
  }
}
if(!config.remoteserial) {
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
      //io_local.sockets.emit('serialData', data);
      io_local.sockets.emit('serialParams', params);
      if(params.rhb) {
        sendserialcommand("h1");
        get_my_ip();
      }
      if(params.computerpowerstate) {
        wf("status_computerpowerstate.txt", params.computerpowerstate);
      }
      setTimeout(function () {
        //get essential data
        sendserialcommand("s1");
      }, 220);
    });
  });
}

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


// Emit welcome message on connection
io_local.sockets.on('connection', function(socket) {
    var newdate = new Date();
    var address = socket.handshake.address;

    console.log("Client: " + address.address + ":" + address.port + " @ " + newdate);

    socket.emit('welcome', { 
        message: 'Welcome to Server Console',
        address: address.address
    });

    socket.on('serialCommand', function(instruction) {
        sendserialcommand(instruction);
    });
});
      
      



function wf(thefile, filecontents, docallback) {
    fs.writeFile(thefile, filecontents, function () {
        if(docallback) {
          docallback();
        }
    });
}








function compile_css(css_file, docallback) {
  sass.render({
    file: css_file,
    success: function(css) {
      if(docallback) {
        docallback(css);
      }
    }
  });
}




app.get('/', function (request, response) {
  var respond = function () {
    jade.renderFile('index.jade', {viewdata: view_data}, function (err, html) {
      if (err) throw err;
      response.send(html);
    });
  }

  if(config.remoteserial) {
      var get_status_options = {
        host: config.remote_serial_ip,
        port: config.listenport,
        path: "/status_computerpowerstate.txt"
      };
      http.get(get_status_options, function(res) {
          res.on("data", function(chunk) {
            console.log("SUCCESS, RETRIEVED STATUS: " + chunk);
            view_data.cps = chunk;
            respond();
          });
      }).on('error', function(e) {
          console.log("get server ip ERROR: " + e.message);
      });
  } else {
    respond();    
  }
});
app.get('/client_config.js', function (request, response) {
  response.sendfile(__dirname + '/client_config.js');
});
app.get('/client.js', function (request, response) {
  response.sendfile(__dirname + '/client.js');
});
app.get('/style.css', function (request, response) {
  console.log(' ');
  var cssinfofile = 'info_file_csslastmodified.txt';
  var getstatswritemtime = function() {
    fs.readFile(cssinfofile, function(err, data) {
      var oldmtime_raw = new Date(data);
      var oldmtime = oldmtime_raw.getTime();
      console.log('oldmtime: ' + oldmtime);
      fs.stat('style.scss', function (err, stats) {
        var newmtime_raw = new Date(stats.mtime);
        var newmtime = newmtime_raw.getTime();
        if(oldmtime != newmtime) {
          console.log('oldmtime ('+oldmtime+') and stats.mtime ('+stats.mtime+') do not match.');
          wf(cssinfofile, stats.mtime, function () {
            //does not match
            console.log("Recompiling CSS...");
            compile_css('style.scss', function (css) {
              wf("compiled.css", css, function () {
                console.log("Finished CSS Compile");
                response.sendfile(__dirname + '/compiled.css');
              });
            });
          });
        } else {
          //has not changed.
          console.log('Times match. Sending old compiled.css');
          response.sendfile(__dirname + '/compiled.css');
        }
      });
    });
  }
  fs.exists(cssinfofile, function (exists) {
    if(exists) {
      //don't bother creating the file first, it already exists
      console.log('FILE ALREADY EXISTS');
      getstatswritemtime();
    } else {
      wf(cssinfofile, 'newlycreated', function () {
        console.log('FILE does not EXIST');
        console.log('Created new file');
        getstatswritemtime();
      });
      
    }
  });
});
app.get('/jquery/jquery-2.0.3.min.js', function (request, response) {
  response.sendfile(__dirname + '/jquery/jquery-2.0.3.min.js');
});
app.get('/jquery/jquery-2.0.3.min.map', function (request, response) {
  response.sendfile(__dirname + '/jquery/jquery-2.0.3.min.map');
});
app.get('/status_computerpowerstate.txt', function (request, response) {
  response.sendfile(__dirname + '/status_computerpowerstate.txt');
});


io_local.configure(function(){
  io_local.set('log level', 1);  //tells IO socket to be mostly quiet.
});