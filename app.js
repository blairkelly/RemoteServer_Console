var config = require('./private_config');
var http = require('http');
var moment = require('moment');

console.log(' ');
console.log(' ');
console.log('Remote Server Console. Starting... ' + moment().format('MMMM Do YYYY, h:mm:ss a'));

var request = require('request');

var fs = require('fs');
var express = require('express');
var app = express();           // start Express framework
app.configure(function(){
    app.use(express.static(__dirname + '/public'));
});
var server = require('http').createServer(app); // start an HTTP server
var io_local = require('socket.io').listen(server);

var jade = require('jade');
var sass = require('node-sass');
var old_css_mtime = null;
var computerpowerstate = null;
var computerpowerstate_recentlychanged = false;




var recorded_json_location = __dirname + '/public/recorded.json';
var saved_data = {}
rf(recorded_json_location, function (data) {
    if(data.length > 0) {
        saved_data = JSON.parse(data);
    } else {
        console.log("nothing in saved data file");
    }  
    if(!saved_data.max_clients_ever) {
        saved_data.max_clients_ever = 0;
        wj(recorded_json_location, saved_data);
    }
});




var view_data = {
    cps: "off",
    pbenabled: "enabled"
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
      }
      if(params.computerpowerstate) {
        if(computerpowerstate != params.computerpowerstate) {
          io_local.sockets.emit('appParams', {
            pbstatus: 'disabled'
          });
          computerpowerstate = params.computerpowerstate;
          wf(__dirname + '/public/compiled/status_computerpowerstate.txt', params.computerpowerstate);
          computerpowerstate_recentlychanged = true;
          setTimeout(function () {
            computerpowerstate_recentlychanged = false;
            io_local.sockets.emit('appParams', {
              pbstatus: 'enabled'
            });
          }, 7500);
        }
      }
      if(params.actionstatus) {
        if(params.actionstatus == "fpbp") {
          if(!computerpowerstate_recentlychanged) {
            io_local.sockets.emit('appParams', {
              pbstatus: 'enabled'
            });
          }
        }
      }
    });
    //get a status code.
    sendserialcommand("s1");
    console.log('opened serial port');
  });
}


//ip string cleanup
var clean_ip_string = function (this_ip) {
  //var ip_regex_pattern = "/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).‌​(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.t‌​est('10.10.10.10')";
  //var cleaned_ip = String(this_ip).match(ip_regex_pattern);  //why isn't this working?
  var cleaned_ip = String(this_ip);
  return cleaned_ip;
}


//ip stuff
var get_ip_options = {
  host: config.get_ip_host,
  port: config.get_ip_port,
  path: config.get_ip_path
};
var get_oldip_options = {
  host: config.get_oldip_host,
  port: config.get_oldip_port,
  path: config.get_oldip_path
};
//post options
var post_ip_form_location = 'http://' + config.post_ip_host + ':' + config.post_ip_port + config.post_ip_path;
//console.log('post_ip_form_location: ' + post_ip_form_location);

var getting_ip = false;
var checktime = moment();
var checkdelay = 300; //seconds
var original_checkdelay = checkdelay;
var get_my_ip = function () {
  if (!getting_ip) {
    getting_ip = true;
    console.log("Getting ip... " + moment().format('MMMM Do YYYY, h:mm:ss a'));
    http.get(get_ip_options, function(res) {
        res.on("data", function(chunk) {
            var newly_checked_ip = clean_ip_string(chunk);
            http.get(get_oldip_options, function (oldip_res) {
                oldip_res.on("data", function(oldip_chunk) {
                    var current_ip = clean_ip_string(oldip_chunk);
                    if (current_ip != newly_checked_ip) {
                        console.log("Old IP: " + current_ip + "   New IP: " + newly_checked_ip);
                        request.post(
                            post_ip_form_location,
                            { form: { key: newly_checked_ip, secret: config.post_secret } },
                            function (error, response, body) {
                                if (error) {
                                    console.log("post-ing exploded somehow ERROR: " + error); 
                                }
                                if (response.statusCode == 200) {
                                    console.log('success posting ip');
                                }
                                console.log(body);
                                getting_ip = false;
                                checkdelay = original_checkdelay;
                                console.log(checkdelay + ": done post");
                                checktime = moment().add(checkdelay, 's');  //set next checktime
                            }
                        );
                    }
                    else {
                        getting_ip = false;
                        checkdelay+=20;
                        console.log(checkdelay + ": No need to update.");
                        checktime = moment().add(checkdelay, 's');  //set next checktime
                    }

                });
            });
        });
    }).on('error', function(e) {
        console.log("get_newly_checked_ip_options ERROR: " + e.message);
    });
  }
}

setInterval(function () {
    //is it time to check again?
    if (checktime.isAfter()) {
        //checktime is after now, so do nothing
    }
    else {
        //checktime is before now.
        get_my_ip();
    }
}, 5000);
get_my_ip();


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

function af(thefile, filecontents, docallback) {
    fs.appendFile(thefile, filecontents, function () {
        if(docallback) {
          docallback();
        }
    });
}
function wf(thefile, filecontents, docallback) {
    fs.writeFile(thefile, filecontents, function () {
        if(docallback) {
          docallback();
        }
    });
}
function wj(thefile, filecontents, docallback) {
    fs.writeFile(thefile, JSON.stringify(filecontents), function () {
        if(docallback) {
          docallback();
        }
    });
}
function rf(thefile, docallback) {
    fs.readFile(thefile, function (err,data) {
        if (err) throw err;
        if(docallback) {
          docallback(data);
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


if(config.remoteserial) {
    
}


app.get('/', function (request, response) {
  var respond = function () {
    jade.renderFile(__dirname + '/public/views/index.jade', {viewdata: view_data}, function (err, html) {
      if (err) throw err;
      response.send(html);
    });
  }

  if(config.remoteserial) {
      var get_status_options = {
        host: config.remote_serial_ip,
        port: config.listenport,
        path: "/compiled/status_computerpowerstate.txt"
      };
      http.get(get_status_options, function(res) {
          res.on("data", function(chunk) {
            console.log("statusCode is " + res.statusCode + " ... received: " + chunk);
            if(res.statusCode == 200) {
              view_data.cps = chunk;
            } else {
              view_data.cps = "off";
            }
            respond();
          });
      }).on('error', function(e) {
          console.log("get server ip ERROR: " + e.message);
      });
  }
  else {
    view_data.cps = computerpowerstate;
    respond();    
  }
});

app.get('/recorded', function (req, res) {
  var stringified_saved = JSON.stringify(saved_data, null, 4);
  var res_html = '<div><pre>'+stringified_saved+'</pre></div>'
  res.send(res_html);
});

app.get('/styles/style.css', function (request, response) {
  console.log(' ');
  var cssinfofile = __dirname + '/public/compiled/info_file_csslastmodified.txt';
  var css_scss_file_path = __dirname + '/public/styles/style.scss';
  var compiled_css_path = __dirname + '/public/compiled/compiled.css';
  var getstatswritemtime = function() {
    fs.readFile(cssinfofile, function(err, data) {
      var oldmtime_raw = new Date(data);
      var oldmtime = oldmtime_raw.getTime();
      fs.stat(css_scss_file_path, function (err, stats) {
        var newmtime_raw = new Date(stats.mtime);
        var newmtime = newmtime_raw.getTime();
        if(oldmtime != newmtime) {
          wf(cssinfofile, stats.mtime, function () {
            //does not match
            console.log("Recompiling CSS...");
            compile_css(css_scss_file_path, function (css) {
              wf(compiled_css_path, css, function () {
                console.log("Finished CSS Compile");
                response.sendfile(compiled_css_path);
              });
            });
          });
        } else {
          //has not changed.
          response.sendfile(compiled_css_path);
        }
      });
    });
  }
  fs.exists(cssinfofile, function (exists) {
    if(exists) {
      //don't bother creating the file first, it already exists
      //console.log('FILE ALREADY EXISTS');
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



io_local.configure(function(){
  io_local.set('log level', 1);  //tells IO socket to be mostly quiet.
});