
$(function () {
    socket.on('data', function(data){
        let first = false;
        if (!DEMData) {
            first = true;
        }
        DEMData = data


		for (let deviceState of DEMData.devices) {
		/*
            if (deviceState.name.startsWith('Load-')) {
				//for (let house of houses) {
				//	if (house.number == parseInt(deviceState.name.charAt(11)) ) {
				//		console.log("Hello world!"); 
				//		house.power = deviceState.consumption.ELECTRICITY;
				//	}
				//}
				continue;
            }
			if (deviceState.name.startsWith('SmartMeter-House-')) {
				//console.log(deviceState.name.charAt(11)); 
				for (let house of houses) {
					if (house.number == parseInt(deviceState.name.charAt(17)) ) {
						house.power = deviceState.consumption.ELECTRICITY;
					}
				}
				continue;
            }
			
			*/
			var dev = null;
			var dev = document.getElementById(deviceState.name);
			if (dev) {
				var power = null;
				for (var i = 0; i < dev.childNodes.length; i++) {
					if (dev.childNodes[i].className == "power") {
						power = dev.childNodes[i];
						
						let consumption = deviceState.consumption.ELECTRICITY;
						if (consumption !== undefined && consumption !== null) {
							if (consumption.real != undefined) {
								consumption = consumption.real;
							}
						  let signedConsumption = Number(consumption);
						  let directionThreshold = 50;
						  let isChargingOrProducing =
							  (dev.classList.contains("ev") && signedConsumption > directionThreshold) ||
							  (dev.classList.contains("bat") && signedConsumption > directionThreshold) ||
							  (dev.classList.contains("pv") && signedConsumption < -directionThreshold);
						  let isDischargingOrConsuming =
							  (dev.classList.contains("bat") && signedConsumption < -directionThreshold) ||
							  (!dev.classList.contains("bat") && !isChargingOrProducing && Math.abs(signedConsumption) > directionThreshold);
						  if (isChargingOrProducing) {
							  power.style.backgroundColor = "rgba(68, 255, 68,0.5)";
						  }
						  else if (isDischargingOrConsuming) {
							  power.style.backgroundColor = "rgba(255, 68, 68,0.5)";
						  }
						  else {
							  power.style.backgroundColor = "rgba(180, 180, 180,0.35)";
						  }
						  consumption = Math.abs(consumption);
						  if (consumption < directionThreshold) {
							  consumption = 0;
						  }
						  let scale = (parseFloat(dev.getAttribute('data-z')) || 1);
						  var width = Math.max(0,Math.min(96,((consumption/(3700*scale))*96)));
						  power.style.width = width+"%"; 
						}
					} 
					else if (dev.childNodes[i].className == "soc") {
					  soc = dev.childNodes[i];
					  var socvar = (deviceState.soc/deviceState.capacity)
					  if ((socvar) < 0.2) {
						  soc.style.backgroundColor = "rgba(255, 68, 68,1)"; 
					  }
					  else if ((socvar) < 0.4) {
						  soc.style.backgroundColor = "rgba(255, 255, 68,1)"; 
					  }
					  else {
						  soc.style.backgroundColor = "rgba(68, 255, 68,1)"; 
					  }
					  var width = Math.max(0,Math.min(96,(socvar*96)));
					  soc.style.width = width+"%"; 
					} 
				}
			}
		
			/*

            // New device from an outside source
            if (devices.filter(dev => dev.uuid == idFromName(deviceState.name)).length == 0) {
                let deviceObject = Device.fromDemData(deviceState);
                if (deviceObject) {
                    devices.push(deviceObject);
                    deviceObject.house.addDevice(deviceObject);
                }
            }

            if (!Object.keys(DEMDevices).includes(deviceState.name)) {
                devices.filter(dev => dev.uuid == idFromName(deviceState.name))[0].demname = deviceState.name;
            }
			*/
            //DEMDevices[deviceState.name] = deviceState;
		}
		/*
        if (first) {
            network.setNetwork(data.network);

            for (let house of houses) {
                let smartDevices = [];
                for (let device of house.devices) {
                    for (let controller of DEMData.controllers) {
                        if (idFromName(controller.name) == idFromName(device.demname)) {
                            console.log(device.demname, controller.name)
                            smartDevices.push(device);
                        }
                    }
                }
                if (smartDevices.length == house.devices.length && house.devices.length > 0) {
                    house.isSmart = true;
                }
            }
        }

        // Check if a device has been removed from DEMKit, and remove it here as well
        let idsOfDevicesInDEMKit = DEMData.devices.map(dev => idFromName(dev.name));
        let deletedDevices = devices.filter(dev => dev.house != null && !idsOfDevicesInDEMKit.includes(dev.uuid));

        for (let device of deletedDevices) {
            device.house.removeDevice(device);
            devices.splice(devices.indexOf(device), 1);
        }
		
		*/
        network.updateNetwork(data.network);
		
    })

	/*
    socket.on('tickResponse', function(response) {
        let playButton = document.getElementById('playButton');
    });

    socket.on('obtainedControl', function(response) {
        isMaster = true;
        doTick();
    });
	*/
});

/*
function removeDeviceFromHouse(device){
    socket.emit('remove', device.name)
}

function doTick() {
    socket.emit('requestTick');
}

*/
function removeDeviceFromDEMKit(name) {
    socket.emit('removeDevice', name)
}
/*
function requestControl() {
    socket.emit('requestControl');
}
*/
function addDeviceToDEMKit(type, housenumber, name, scale, onResult) {
    if (typeof onResult !== 'function') {
        socket.emit('addDevice', {type, housenumber, name, scale});
        return;
    }
    if (!socket.connected) {
        onResult(false, 'The web server is disconnected. Please reconnect and try again.');
        return;
    }

    let completed = false;
    const timer = setTimeout(function () {
        finish(false, 'No confirmation from DEMKit. Please reconnect and refresh the page.');
    }, 12000);
    function finish(success, message) {
        if (completed) return;
        completed = true;
        clearTimeout(timer);
        onResult(success, message);
    }

    socket.emit('addDevice', {type, housenumber, name, scale}, function (reply) {
        finish(!!(reply && reply.ok), reply && reply.message);
    });
}

function updateSettings(deviceName, newProperties) {
    socket.emit('editDevice', {properties: newProperties, name: deviceName});
}

function fixCable(name) {
    let cable = network.cables.filter(cable => cable.name == name)[0];
    if (cable) {
        cable.burned = false;
    }

    socket.emit('fixCable', { name });
}

