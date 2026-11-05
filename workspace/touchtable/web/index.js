var express = require("express");
var app = express();
const bodyParser = require("body-parser");
var cors = require('cors');
var http = require('http').createServer(app);
var io = require('socket.io')(http);
const request = require('./demkitHttpClient');


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cors());
app.use(express.static('static'))

let DEMIp = process.env.DEM_HOST || 'localhost';
let DEMPort = process.env.DEM_PORT || '3001';
let url = 'http://' + DEMIp + ':' + DEMPort + '/'
let urlForTick = url + "tick";
let latestDemState = null;

function handleDemResponse(err, res, acknowledge) {
    let result;
    if (err) {
        console.error('DEMKit request failed:', err.message);
        result = {ok: false, message: 'DEMKit is unavailable. Restart the simulation and try again.'};
    } else if (!res) {
        console.error('DEMKit did not return a response');
        result = {ok: false, message: 'No reply from DEMKit. Please try again.'};
    } else if (res.statusCode < 200 || res.statusCode >= 300) {
        console.error('DEMKit returned HTTP', res.statusCode);
        result = {ok: false, message: 'DEMKit could not process that device (HTTP ' + res.statusCode + ').'};
    } else {
        console.log('DEMKit request succeeded:', res.statusCode);
        result = {ok: true};
    }
    if (typeof acknowledge === 'function') {
        acknowledge(result);
    }
    return result;
}

console.log(urlForTick)

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/static/index.html');
})

app.get('/graphs', (req, res) => {
  res.sendFile(__dirname + '/static/graphs.html');
})

app.post('/dem/state', (req, res) => {
    latestDemState = req.body;
    io.sockets.emit('data', req.body);
    res.sendStatus(202)
})

io.on('connection', function(socket){
    console.log('a user connected', socket.id);

    if (latestDemState) {
        socket.emit('data', latestDemState);
    }

    socket.on('requestTick', function() {
        //request(urlForTick, {json: {clientId: socket.id}}, (err, res, body) => {
        //    io.sockets.connected[socket.id].emit('tickResponse', body);
        //});
    });

	socket.on('simPlay', function() {
        request.get(url + 'syncset/host/pause/false', (err, res, body) => {
			if (err) {
                return console.log(err);
            }
		});
    });
	
	socket.on('simPause', function() {
		request.get(url + 'syncset/host/pause/true', (err, res, body) => {
			if (err) {
                return console.log(err);
            }
		});
    });
	
	socket.on('controlOn', function() {
        request.get(url + 'syncset/host/executeControl/true', (err, res, body) => {
			if (err) {
                return console.log(err);
            }
		});
		request.get(url + 'syncset/Auctioneer/islanding/false', (err, res, body) => {
			if (err) {
                return console.log(err);
            }
		});
    });
	
	socket.on('controlIsland', function() {
		request.get(url + 'syncset/host/executeControl/true', (err, res, body) => {
			if (err) {
                return console.log(err);
            }
		});
        request.get(url + 'syncset/Auctioneer/islanding/true', (err, res, body) => {
			if (err) {
                return console.log(err);
            }
		});
    });
	
	socket.on('controlOff', function() {
		request.get(url + 'syncset/host/executeControl/false', (err, res, body) => {
			if (err) {
                return console.log(err);
            }
		});
		request.get(url + 'syncset/Auctioneer/islanding/false', (err, res, body) => {
			if (err) {
                return console.log(err);
            }
		});
    });

    socket.on('requestTicks', function() {
       request(urlForTick, {json: {clientId: socket.id}}, (err, res, body) => {
            io.sockets.connected[socket.id].emit('tickResponse', body);
        });
    });

    socket.on('requestControl', function() {
		//io.sockets.connected[socket.id].emit('obtainedControl');
    });

	socket.on('removeDevice', function(name) {
		request.post(url + 'synccmds', {json: 
			[
				{ cmd: 'removeObj', entity : name},
				{ cmd: 'removeObj', entity : "Controller-"+name} 
			]
		}, (err, res, body) => {
				handleDemResponse(err, res);
		});
		
	});

	socket.on('addDevice', function(settings, acknowledge) {
        let type = settings.type;
        let config = {
            name: settings.name,
			meter: 'SmartMeter-House-'+settings.housenumber,
			housenumber: settings.housenumber,
			scale: settings.scale
        };

        switch (settings.type) {
            case 'bat':
                addBattery(config, acknowledge);
                break;
            case 'pv':
                addSolarPanel(config, acknowledge);
                break;
            case 'dw':
                addDishwasher(config, acknowledge);
                break;
            case 'wm':
                addWashingMachine(config, acknowledge);
                break;
            case 'ev':
                addVehicle(config, acknowledge);
                break;
            case 'hp':
                addHeatpump(config, acknowledge);
                break;
            default:
                if (typeof acknowledge === 'function') {
                    acknowledge({ok: false, message: 'Unknown device type.'});
                }
        }
	});

    socket.on('editDevice', function(settings) {
		request.post(url + 'syncsetnp/'+settings.name, {json: 
			settings.properties
		}, (err, res, body) => {
				handleDemResponse(err, res);
		});
    });

    socket.on('fixCable', function(settings) {
        request.post(url + 'synccmds', {json: 
			[
				{ cmd: 'callFunction', entity : settings.name, func: 'reset', args: { restoreGrid: true } }
			]
		}, (err, res, body) => {
				handleDemResponse(err, res);
		});
    })
});

function addBattery(config, acknowledge) {
	request.post(url + 'synccmds', {timeout: 8000, json: 
		[
			{ cmd: 'createObj', 'entity' : 'BufDev', 'val': 
				[
					{name: config.name},
					{host: null}
				],
			},
			{ cmd: 'setVar', entity: config.name, 'var': 'capacity', 'val': parseInt(5000*config.scale) },
			{ cmd: 'setVar', entity: config.name, 'var': 'initialSoC', 'val': parseInt(2500*config.scale) },
			{ cmd: 'setVar', entity: config.name, 'var': 'chargingPowers', 'val': [parseInt(-3700*config.scale), parseInt(3700*config.scale)] },
			{ cmd: 'setVar', entity: config.name, 'var': 'gridChargingStrategy', 'val': 'solar_only' },
			{ cmd: 'setVar', entity: config.name, 'var': 'gridReserveTargetSoc', 'val': 0.80 },
			{ cmd: 'setVar', entity: config.name, 'var': 'smartDischargeFloorSoc', 'val': 0.20 },
			{ cmd: 'setVar', entity: config.name, 'var': 'gridChargePowerLimit', 'val': parseInt(1000*config.scale) },
			{ cmd: 'setVar', entity: config.name, 'var': 'gridChargeLoadThreshold', 'val': parseInt(1000*config.scale) },
			{ cmd: 'setVar', entity: config.name, 'var': 'smartHighLoadThreshold', 'val': parseInt(1500*config.scale) },
			{ cmd: 'setVar', entity: config.name, 'var': 'manualChargePowerLimit', 'val': parseInt(1000*config.scale) },
			{ cmd: 'setVar', entity: config.name, 'var': 'manualDischargePowerLimit', 'val': parseInt(1850*config.scale) },
			{ cmd: 'setVar', entity: config.name, 'var': 'timeBase', 'val': 900 },
			{ cmd: 'setVar', entity: config.name, 'var': 'strictComfort', 'val': false },
			{ cmd: 'callFunction', entity : config.name, func: 'startup', args: null},
			{ cmd: 'callFunction', entity : config.meter, func: 'addDevice', args: {obj: config.name}},
			{ cmd: 'setObj', entity: config.name, 'var': 'meter', 'val': config.meter },
			{ cmd: 'setVar', entity: config.name, 'var': 'balancing', 'val': true },
			{ cmd: 'createObj', 'entity' : 'BufAuctionCtrl', 'val': 
				[
					{name: "Controller-"+config.name},
					{obj: config.name},
					{obj: "Aggregator-"+config.housenumber},
					{host: null}
				],
			},
			{ cmd: 'setVar', entity: "Controller-"+config.name, 'var': 'strictComfort', 'val': false },
			{ cmd: 'callFunction', entity : "Controller-"+config.name, func: 'startup', args: null}
		]
	}, (err, res, body) => {
            handleDemResponse(err, res, acknowledge);
    });
}

function addSolarPanel(config, acknowledge) {
	request.post(url + 'synccmds', {timeout: 8000, json: 
		[
			{ cmd: 'createObj', 'entity' : 'SolarPanelDev', 'val': 
				[
					{name: config.name},
					{host: null},
					{obj: 'Sun'}
				],
			},
			{ cmd: 'setVar', entity: config.name, 'var': 'size', 'val': parseInt(10*config.scale*config.scale) },
			{ cmd: 'setVar', entity: config.name, 'var': 'panels', 'val': parseInt(6*config.scale*config.scale) },
			{ cmd: 'setVar', entity: config.name, 'var': 'wattPeak', 'val': 300 },
			{ cmd: 'setVar', entity: config.name, 'var': 'timeBase', 'val': 900 },
			{ cmd: 'setVar', entity: config.name, 'var': 'strictComfort', 'val': false },
			{ cmd: 'callFunction', entity : config.name, func: 'startup', args: null},
			{ cmd: 'callFunction', entity : config.meter, func: 'addDevice', args: {obj: config.name}},
			{ cmd: 'createObj', 'entity' : 'CurtAuctionCtrl', 'val': 
				[
					{name: "Controller-"+config.name},
					{obj: config.name},
					{obj: "Aggregator-"+config.housenumber},
					{host: null}
				],
			},
			{ cmd: 'setVar', entity: "Controller-"+config.name, 'var': 'strictComfort', 'val': false },
			{ cmd: 'callFunction', entity : "Controller-"+config.name, func: 'startup', args: null}
		]
	}, (err, res, body) => {
            handleDemResponse(err, res, acknowledge);
    });

}




function addWashingMachine(config, acknowledge) {
    request.post(url + 'synccmds', {timeout: 8000, json: 
		[
			{ cmd: 'createObj', 'entity' : 'TtTsDev', 'val': 
				[
					{name: config.name},
					{host: null},
				],
			},
			{ cmd: 'setVar', entity: config.name, 'var': 'strictComfort', 'val': false },
			{ cmd: 'callFunction', entity : config.name, func: 'startup', args: null},
			{ cmd: 'callFunction', entity : config.meter, func: 'addDevice', args: {obj: config.name}},
			{ cmd: 'createObj', 'entity' : 'TsAuctionCtrl', 'val': 
				[
					{name: "Controller-"+config.name},
					{obj: config.name},
					{obj: "Aggregator-"+config.housenumber},
					{host: null}
				],
			},
			{ cmd: 'setVar', entity: "Controller-"+config.name, 'var': 'strictComfort', 'val': false },
			{ cmd: 'callFunction', entity : "Controller-"+config.name, func: 'startup', args: null}
		]
	}, (err, res, body) => {
            handleDemResponse(err, res, acknowledge);
    });
}

function addDishwasher(config, acknowledge) {
    request.post(url + 'synccmds', {timeout: 8000, json: 
		[
			{ cmd: 'createObj', 'entity' : 'TtTsDevDw', 'val': 
				[
					{name: config.name},
					{host: null},
				],
			},
			{ cmd: 'setVar', entity: config.name, 'var': 'strictComfort', 'val': false },
			{ cmd: 'callFunction', entity : config.name, func: 'startup', args: null},
			{ cmd: 'callFunction', entity : config.meter, func: 'addDevice', args: {obj: config.name}},
			{ cmd: 'createObj', 'entity' : 'TsAuctionCtrl', 'val': 
				[
					{name: "Controller-"+config.name},
					{obj: config.name},
					{obj: "Aggregator-"+config.housenumber},
					{host: null}
				],
			},
			{ cmd: 'setVar', entity: "Controller-"+config.name, 'var': 'strictComfort', 'val': false },
			{ cmd: 'callFunction', entity : "Controller-"+config.name, func: 'startup', args: null}
		]
	}, (err, res, body) => {
            handleDemResponse(err, res, acknowledge);
    });
}

function addVehicle(config, acknowledge) {
    request.post(url + 'synccmds', {timeout: 8000, json: 
		[
			{ cmd: 'createObj', 'entity' : 'TtBtsDev', 'val': 
				[
					{name: config.name},
					{host: null},
				],
			},
			{ cmd: 'setVar', entity: config.name, 'var': 'strictComfort', 'val': false },
			{ cmd: 'setVar', entity: config.name, 'var': 'capacity', 'val': parseInt(25000*config.scale*config.scale) },
			{ cmd: 'setVar', entity: config.name, 'var': 'timeBase', 'val': 900 },
			{ cmd: 'setVar', entity: config.name, 'var': 'chargingPowers', 'val': [0, parseInt(3700*config.scale)] },
			{ cmd: 'callFunction', entity : config.name, func: 'startup', args: null},
			{ cmd: 'callFunction', entity : config.meter, func: 'addDevice', args: {obj: config.name}},
			{ cmd: 'createObj', 'entity' : 'BtsAuctionCtrl', 'val': 
				[
					{name: "Controller-"+config.name},
					{obj: config.name},
					{obj: "Aggregator-"+config.housenumber},
					{host: null}
				],
			},
			{ cmd: 'setVar', entity: "Controller-"+config.name, 'var': 'strictComfort', 'val': false },
			{ cmd: 'callFunction', entity : "Controller-"+config.name, func: 'startup', args: null}
		]
	}, (err, res, body) => {
            handleDemResponse(err, res, acknowledge);
    });
}

function addHeatpump(config, acknowledge) {
	request.post(url + 'synccmds', {timeout: 8000, json: 
		[
			{ cmd: 'createObj', 'entity' : 'BufConvDev', 'val': 
				[
					{name: config.name},
					{host: null}
				],
			}, //debug stuff here to test with a normal load, needs to be replaced
			{ cmd: 'setVar', entity: config.name, 'var': 'capacity', 'val': parseInt(5000*config.scale*config.scale) },
			{ cmd: 'setVar', entity: config.name, 'var': 'chargingPowers', 'val': [0, parseInt(3700*config.scale)] },
			{ cmd: 'setVar', entity: config.name, 'var': 'cop', 'val': 4.0 },
			{ cmd: 'setVar', entity: config.name, 'var': 'soc', 'val': parseInt(2500*config.scale*config.scale) },
			{ cmd: 'setVar', entity: config.name, 'var': 'initialSoC', 'val': parseInt(2500*config.scale*config.scale) },
			{ cmd: 'setVar', entity: config.name, 'var': 'filename', 'val': "alpg/output/demo/Heat_Profile.csv" },
			{ cmd: 'setVar', entity: config.name, 'var': 'column', 'val': config.housenumber },
			{ cmd: 'setVar', entity: config.name, 'var': 'scaling', 'val': parseInt(3*config.scale) }, //debug stuff here
			{ cmd: 'setVar', entity: config.name, 'var': 'timeBase', 'val': 900 },
			{ cmd: 'setVar', entity: config.name, 'var': 'strictComfort', 'val': false },
			{ cmd: 'callFunction', entity : config.name, func: 'startup', args: null},
			{ cmd: 'callFunction', entity : config.meter, func: 'addDevice', args: {obj: config.name}},
			{ cmd: 'createObj', 'entity' : 'BufConvAuctionCtrl', 'val': 
				[
					{name: "Controller-"+config.name},
					{obj: config.name},
					{obj: "Aggregator-"+config.housenumber},
					{host: null}
				],
			},
			{ cmd: 'setVar', entity: "Controller-"+config.name, 'var': 'strictComfort', 'val': false },
			{ cmd: 'callFunction', entity : "Controller-"+config.name, func: 'startup', args: null}
		]
	}, (err, res, body) => {
            handleDemResponse(err, res, acknowledge);
    });
}


const PORT = process.env.PORT || 3002;
const WEB_HOST = process.env.WEB_HOST;
// A packaged desktop app binds to loopback only; keep existing development
// behavior when WEB_HOST is not configured.
http.listen(PORT, WEB_HOST || undefined, () => {
    console.log("Server running on port " + PORT );
});

// Electron's main process can close the server on application shutdown.
module.exports = http;
