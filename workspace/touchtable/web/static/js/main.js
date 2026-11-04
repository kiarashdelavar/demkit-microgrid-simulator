let c = document.getElementById("canvas");
let ctx = c.getContext("2d");
window.devicePixelRatio = 1;
let dpi = window.devicePixelRatio;


function fix_dpi() {
//create a style object that returns width and height
    let style = {
        height() {
        return +getComputedStyle(canvas).getPropertyValue('height').slice(0,-2);
        },
        width() {
        return +getComputedStyle(canvas).getPropertyValue('width').slice(0,-2);
        }
    }
//set the correct attributes for a crystal clear image!
    canvas.setAttribute('width', style.width() * dpi);
    canvas.setAttribute('height', style.height() * dpi);
}

window.addEventListener('resize', fix_dpi)
fix_dpi();


let DEMData = null;
let DEMDevices = {};
let isMaster = true;

var background = new Background();
let network = new Network(MOCK_NETWORK);
network.setNetwork(MOCK_NETWORK);

let last = 10; //Date.now();
let first = true;

function drawloop(now) {
    let dt = (now - last) / 1000;

	if (dt >= 10 || first) {
		// Update calls
		background.update(dt, now);

		/*
		devices.forEach(device => {
			device.update(dt, now);
		});

		*/
		network.update(dt, now);
		//console.log('hello');
		/*
		
		//check if all devices are still in a house or update them
		devices.forEach(device => {
			let didSomething = false;
			houses.forEach(house => {
				if (house.isInsideHouse(device.x, device.y)) {
					if (device.house == null && device.movestate == false){
						house.addDevice(device);
						device.addHouse(house);
						didSomething = true;
						//device.uuid = uuid || Math.floor(Math.random() * 2**32).toString(16);
						addDeviceToDEMKit(imageToEndpoint[device.name], house.number, device.uuid, house.isSmart);
					} else if (device.house === house){
						didSomething = true;
					}
				}
			});

			if (!didSomething && device.house != null){
				let houseToRemove = device.house;
				closeSetting(device.uuid);
				device.removeHouse();
				houseToRemove.removeDevice(device);
				if (device.demname) {
					removeDeviceFromDEMKit(device.demname)
				}
			}
		});
		*/
		
		// Draw calls
		background.draw();

		/*
		staticDevices.forEach(device => {
			device.draw();
		});

		houses.forEach(house => {
			house.draw();
		})

		*/
		network.draw();
		/*
		
		trash.draw();

		//check if devices are in thrash
		devices.forEach((device, index) => {
			if(length(device.velocity) < 400 && trash.intersect(device.x, device.y)){
				devices.splice(index, 1);
				//Device.closeSetting(device.uuid);
			}
		})

		//check if devices need to be despawned
		devices.forEach((device, index) => {
			if(device.shouldDespawn(now)){
				//TODO also remove from the house
				devices[index].goal = GARBAGE_CAN_POS;
				//device.closeSetting(device.uuid);
			}
		})

		devices.forEach(device => {
			device.draw();
		});
		*/
		
		//console.log("");
		
		last = now || Date.now();
	}
	
	window.requestAnimationFrame(drawloop);
	//window.setInterval(drawloop(), 1);
}

window.requestAnimationFrame(drawloop);

/*
function grabDevice(clientX, clientY) {
	for (let i = devices.length - 1; i >= 0; i--) {
        let device = devices[i];
		if (device.isClicked(clientX, clientY)) {
			device.grab(clientX, clientY);
			return;
		}
	}

	for (let device of staticDevices) {
		if (device.isClicked(clientX, clientY)) {
			devices.push(new Device(device.name,
				clientX - device.size / 2,
				clientY - device.size / 2, true));
			break;
		}
	}
}

function moveDevice(clientX, clientY) {
	devices.forEach(device => device.mousemove(clientX, clientY));
}

function releaseDevice() {
	devices.forEach(device => device.release());
}

function repairCables(event) {
    for (let cable of network.cables) {
        if (cable.clicked(event.clientX, event.clientY)) {
            fixCable(cable.name);
        }
    }
}

function onClick(event) {
    repairCables(event);
}

window.addEventListener('mousedown', (event) => {
    if (event.button == 0) {
        grabDevice(event.clientX, event.clientY);
    }
})

window.addEventListener('mousemove', (event) => {
	moveDevice(event.clientX, event.clientY);
});


window.addEventListener('mouseup', (event) => {
    if (event.button == 0) {
        releaseDevice();
    }
})

window.addEventListener('click', (event) => {
    onClick(event);
});

window.addEventListener('touchstart', (event) => {
	grabDevice(event.touches[0].clientX, event.touches[0].clientY);
    event.preventDefault();
});

window.addEventListener('touchmove', (event) => {
	moveDevice(event.touches[0].clientX, event.touches[0].clientY);
    event.preventDefault();
})

window.addEventListener('touchend', (event) => {
	releaseDevice();
    event.preventDefault();
});

*/

window.addEventListener('touch', (event) => {
    onClick(event);
});

window.addEventListener('click', (event) => {
    onClick(event);
});

function repairCables(event) {
    // Cable coordinates are measured inside the 1920x1080 canvas.
    // After scrolling, clientX/clientY are viewport coordinates, so
    // subtract the canvas position before checking a cable hit.
    const bounds = c.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    for (let cable of network.cables) {
        if (cable.clicked(x, y) && cable.burned) {
            fixCable(cable.name);
			break;
        }
    }
}

function onClick(event) {
    repairCables(event);
}

