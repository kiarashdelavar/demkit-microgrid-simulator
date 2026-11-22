var express = require("express");
var app = express();
const bodyParser = require("body-parser");
var cors = require('cors');
var http = require('http').createServer(app);
const request = require('./demkitHttpClient');
const io = require('socket.io')(http);


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cors());

let DEMIp = process.env.DEM_HOST || '127.0.0.1';
let DEMPort = process.env.DEM_PORT || '3001';
let url = 'http://' + DEMIp + ':' + DEMPort + '/'
let urlForTick = url + "tick";

app.get('/', (req, res) => {
    res.send("<h3> This is the test client </h3>")
})

app.post('/dem/state', (req, res) => {
    io.sockets.emit('data', req.body);
    console.log("data received from DEM", res)
    res.sendStatus(202)
})

function requestTick(){
    request(urlForTick, {json: {clientId: socket.id}}, (err, res, body) => {
       // io.sockets.connected[socket.id].emit('tickResponse', body);
       
    });
}

function requestTicks(){
    request(urlForTick + '/20', {json: {clientId: socket.id}}, (err, res, body) => {
     //   io.sockets.connected[socket.id].emit('tickResponse', body)
        if (err) {
            return console.log(err);
        }
    });
}

function requestControl(){
    request(url + 'control/request', {json: {clientId: socket.id}}, (err, res, body) => {
        if (body && body.success) {
            io.sockets.connected[socket.id].emit('obtainedControl');
        }
    })
}

function removeDevice(name){
    request.post(url + 'remove', {json: {entity: name}}, (err, res, body) => {
        console.log(err, res, body);
    }); 
}

function addDevice(settings){
    let endpoint = settings.endpoint;
    let config = {
        name: endpoint[0].toUpperCase() + endpoint.slice(1) + '-' + settings.deviceId +
            '-House-' + settings.housenumber
    };

    switch (settings.endpoint) {
        case 'battery':
            config.chargingPower = 12000;
            config.capacity = 6000;
            break;
        case 'solarPanel':
            config.size = 20;
            break;
        case 'dishWasher':
            config.schedule = [[0, 4860]]; // TODO: fill these schedules
            break;
        case 'washingMachine':
            config.schedule = [[0, 4860]];
            break;
        case 'vehicle':
            config.chargingPower = 6000;
            config.capacity = 12000;
            config.hybrid = false;
            config.schedule = [[0, 4860, config.capacity]];
            break;
        case 'boiler':
            config.capacity = 250000;
            break;
        default:

    }

    request.post(url + 'addEntity/' + endpoint, {json: config}, (err, res, body) => {
        console.log(err, body);
    })
}


const PORT = process.env.PORT || 3002;
http.listen(PORT, process.env.WEB_HOST || '127.0.0.1', () => {
    console.log("Server running on port " + PORT );
});
