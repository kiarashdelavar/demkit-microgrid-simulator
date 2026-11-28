
/*
To be able to emulate TactileTriana accurately we will only support 1 network structure here. This includes the names
for all nodes and edges

transformer -0- feeder-0 -1- feeder-0-house-0 -2-  houseconnection-0
                                     |
									 3
									 |
							 feeder-0-house-1 -4-  houseconnection-1
                                     |
									 5
									 |
							 feeder-0-house-2 -6-  houseconnection-2
									 |
									 7
									 |
							 feeder-0-house-3 -8-  houseconnection-3
									 |
									 9
									 |
							 feeder-0-house-4 -10- houseconnection-4
									 |
									 11
									 |
							 feeder-0-house-5 -12- houseconnection-5

*/

const TOPOLOGY = {
	'transformer': {x: 0.1046875 * SCREEN_WIDTH, y: 0.4666666666666667 * SCREEN_HEIGHT },
	'feeder-0': {x: 0.1171875 * SCREEN_WIDTH, y: 0.43766 * SCREEN_HEIGHT }, //'feeder-0': {x: 0.1171875 * SCREEN_WIDTH, y: 0.38425925925925924 * SCREEN_HEIGHT },
	'feeder-0-house-0': {x: 0.1171875 * SCREEN_WIDTH, y: 0.30185185185185187 * SCREEN_HEIGHT },
	'houseconnection-0': {x: 0.1171875 * SCREEN_WIDTH, y: 0.1814814814814815 * SCREEN_HEIGHT },
	'feeder-0-house-1': {x: 0.49166666666666664 * SCREEN_WIDTH, y: 0.30185185185185187 * SCREEN_HEIGHT },
	'houseconnection-1': {x: 0.49166666666666664 * SCREEN_WIDTH, y: 0.1814814814814815 * SCREEN_HEIGHT },
	'feeder-0-house-2': {x: 0.8661458333333333 * SCREEN_WIDTH, y: 0.30185185185185187 * SCREEN_HEIGHT },
	'houseconnection-2': {x: 0.8661458333333333 * SCREEN_WIDTH, y: 0.1814814814814815 * SCREEN_HEIGHT },
	'feeder-0-house-3': {x: 0.8661458333333333 * SCREEN_WIDTH, y: 0.6703703703703704 * SCREEN_HEIGHT },
	'houseconnection-3': {x: 0.8661458333333333 * SCREEN_WIDTH, y: 0.7907407407407407 * SCREEN_HEIGHT },
	'feeder-0-house-4': {x: 0.49166666666666664 * SCREEN_WIDTH, y: 0.6703703703703704 * SCREEN_HEIGHT },
	'houseconnection-4': {x: 0.49166666666666664 * SCREEN_WIDTH, y: 0.7907407407407407 * SCREEN_HEIGHT },
	'feeder-0-house-5': {x: 0.1171875 * SCREEN_WIDTH, y: 0.6703703703703704 * SCREEN_HEIGHT },
	'houseconnection-5': {x: 0.1171875 * SCREEN_WIDTH, y: 0.7907407407407407 * SCREEN_HEIGHT }
}

class Network {
	constructor() {
		this.nodes = [];
		this.cables = [];
	}

	setNetwork(network) {
		// First we set the cables and nodes as a string as they don't exist yet
		this.nodes = [];
		for (let node of network.nodes) {
			this.nodes.push(new Node(node.name, node.edges, TOPOLOGY[node.name], node.voltage));
		}

		this.cables = [];
		for (let edge of network.edges) {
			this.cables.push(new Cable(edge.name, edge.nodes, edge.ampacity, edge.current));
		}

		let transformer = this.getNode('transformer')
		transformer.color = {r: 0x6b, g: 0x6b, b: 0x6b};
		transformer.changeColor = false;
		transformer.size = 79;

		// Now we'll update them to be the actual objects
		for (let node of this.nodes) {
			let cableObjects = this.cables.filter(cable => node.cables.includes(cable.name));
			node.cables = cableObjects;
		}

		for (let cable of this.cables) {
			let nodeObjects = this.nodes.filter(node => cable.nodes.includes(node.name));
			cable.nodes = nodeObjects;
			cable.init();
		}


	}

	update(dt, now) {
		for (let cable of this.cables) {
			cable.update(dt, now);
		}
	}

	getNode(name) {
		return this.nodes.filter(node => node.name == name)[0]
	}

	draw() {
		for (let cable of network.cables) {
			cable.draw();
		}
		for (let node of network.nodes) {
			node.draw();
		}

	}

	updateNetwork(network) {
		for (let node of this.nodes) {
			let netNode = network.nodes.filter(n => n.name == node.name);
			if (netNode.length == 1) {
				node.voltage = netNode[0].voltage;
			}
		}

		for (let cable of this.cables) {
			let netEdge = network.edges.filter(e => e.name == cable.name);
			if (netEdge.length == 1) {
				cable.current = netEdge[0].current;
				cable.direction = netEdge[0].direction || 1;
				cable.burned = netEdge[0].burned === true;
			}
		}

		if (typeof updateHouseOverloadWarnings == "function") {
			updateHouseOverloadWarnings();
		}
	}
}

class Node {
	constructor(name, cables, pos, voltage, changeColor=true) {
		this.name = name;
		this.cables = cables;
		this.pos = pos;
		this.voltage = voltage;
		this.size = 30;
		this.color = {r: 0, g: 255, b: 0};
		this.changeColor = changeColor;
	}

	draw() {
		let color = this.color;
		if (this.changeColor) {
			let diff = 230 - this.voltage;
			let diffSign = Math.sign(diff);
			
			//diff = Math.round(Math.min(255, Math.max(0, 255 * (Math.abs(diff) / 23.0))));
			let diff2 = Math.round(Math.min(510, Math.max(0, 510 * (Math.abs(diff) / 23.0))));
			
			color.g = Math.max(0, Math.min(255, 510 - diff2));
			if (diffSign == -1) {
				color.r = Math.min(255, diff2);
				color.b = 0;
			} else {
				color.r = 0;
				color.b =Math.min(255, diff2);
			}
			if (this.voltage < 3) {
				color = {r: 51, g: 51, b: 51};
			}
			
		}

		
		ctx.beginPath();
		ctx.fillStyle = colorToHex(color);
		ctx.rect(this.pos.x, this.pos.y, this.size, this.size);
		ctx.fill();
		ctx.lineWidth = 2;
		ctx.strokeStyle = "black";
		ctx.stroke();
	}
}

const BOLT_DISTANCE = 50;

class Cable {

	constructor(name, nodes, ampacity, current) {
		this.name = name;
		this.nodes = nodes;
		this.ampacity = ampacity;
		this.current = current;
		this.burned = false;
		this.direction = 1;
		this.width = ampacity > 55 ? 24 : 14;
		this.color = {r: 204, g: 204, b: 204};
	}

	
	init() {
		this.startNode = this.nodes[0];
		this.endNode = this.nodes[1];

		this.lineStart = {
			x: this.startNode.pos.x + Math.floor(this.startNode.size / 2),
			y: this.startNode.pos.y + Math.floor(this.startNode.size / 2)
		}
		this.lineEnd = {
			x: this.endNode.pos.x + Math.floor(this.endNode.size / 2),
			y: this.endNode.pos.y + Math.floor(this.endNode.size / 2)
		}


		let diff = multscalar(add(this.lineStart, multscalar(this.lineEnd, -1)), -1);


		this.length = length(diff);
		let direction = normalize(diff);

		this.particles = [];
		for (let i = 0; i < this.length; i += BOLT_DISTANCE) {
			this.particles.push(new CurrentParticle(this, i, direction))
		}

	}

	update(dt, now) {
		if (!isPaused()) {
			for (let particle of this.particles) {
				particle.update(dt, now);
			}
		}
	}

	draw() {

		ctx.beginPath();
		ctx.moveTo(this.lineStart.x, this.lineStart.y);
		ctx.lineTo(this.lineEnd.x, this.lineEnd.y);

		let color = this.color;
		ctx.lineWidth = this.width + 2;
		ctx.strokeStyle = "black";
		ctx.stroke();
		ctx.lineWidth = this.width;
		if (!this.burned) {
			ctx.strokeStyle = "#cccccc";
			if (this.current < 0.6 * this.ampacity) {
				color = {r: 204, g: 204, b: 204};
			} else if (this.current < 0.8 * this.ampacity){
				let diff = Math.max(0, Math.min(51, Math.round(51 * ((this.current - (0.6 * this.ampacity)) / (0.2 * this.ampacity))))) ;
				color = {r: 204+diff, g: 204, b: 204 - (4*diff)};
			} else {			
				let diff = Math.max(0, Math.min(204, Math.round(204 * ((this.current - (0.8 * this.ampacity)) / (0.2 * this.ampacity))))) ;
				color = {r: 255, g: 204 - diff, b: 0};
			}
			
		} else  {
			ctx.strokeStyle = '#ff6400';
			color = {r: 255, g: 100, b: 0};
		}
		ctx.strokeStyle = colorToHex(color);
		ctx.stroke();

		if (!this.burned) {
			for (let particle of this.particles) {
				particle.draw();
			}
		}
	}

	clicked(x, y) {
		let topleft = {x: 0, y: 0};
		let bottomright = {x: 0, y: 0};
		if (this.lineStart.x == this.lineEnd.x) {
			topleft = {
				x: this.lineStart.x - this.width / 2,
				y: this.lineStart.y,
			}
			bottomright = {
				x: this.lineEnd.x + this.width / 2,
				y: this.lineEnd.y
			}
		} else if (this.lineStart.y == this.lineEnd.y) {
			topleft = {
				x: this.lineStart.x,
				y: this.lineStart.y - this.width / 2
			}
			bottomright = {
				x: this.lineEnd.x,
				y: this.lineEnd.y + this.width / 2
			}
		} else {
			console.warn("clicked function not implemented for diagonal lines.", this.name, this.lineStart, this.lineEnd);
		}

		let minx = Math.min(topleft.x, bottomright.x);
		let miny = Math.min(topleft.y, bottomright.y);
		let maxx = Math.max(topleft.x, bottomright.x);
		let maxy = Math.max(topleft.y, bottomright.y);

		return (
			x >= minx && y >= miny && x <= maxx && y <= maxy
		);
	}
}

class CurrentParticle {
	constructor(cable, place, direction) {
		this.cable = cable;
		this.startPos = cable.nodes[0].pos;
		this.endPos = cable.nodes[1].pos;
		this.place = place;
		this.direction = direction;

		this.lastNow = 0;

		// This ensures evenly spaced bolts
		this.max = this.cable.length + BOLT_DISTANCE - this.cable.length % BOLT_DISTANCE;
	}

	update(dt, now) {
		const SPEED_MOD = 5000;
		if (!Number.isFinite(this.place)) {
			this.place = 0;
		}

		let direction = this.cable.direction || 1;
		let speed = Math.min(0.5, (Math.min(this.cable.current, 15) / 225)) * direction;

		this.place = (this.place + dt * speed * SPEED_MOD) % this.max;

		if (this.place < 0) {
			this.place += this.max;
		}

		this.lastNow = now;
	}

	draw() {
		if (this.place < this.cable.length) {
			let relativePos = multscalar(this.direction, this.place)
			let pos = add(relativePos, add(this.cable.lineStart, { x: -this.cable.width/2, y: -this.cable.width/2 }));
			ctx.beginPath();
			
			let w = 10 - Math.min(7, Math.max(0, (10 * (this.cable.current / (this.cable.ampacity*0.75)) )))
			
			ctx.arc(pos.x+this.cable.width/2, pos.y+this.cable.width/2, this.cable.width/w, 0, 2 * Math.PI);
	
			let color = this.color;
			color = {r: 255, g: 252, b: 0};
			ctx.strokeStyle = colorToHex(color);
			
			if (this.cable.current < 0.01) {
				color = {r: 204, g: 204, b: 204};
				ctx.lineWidth = 1;
				ctx.strokeStyle = colorToHex(color);
			} else if (this.cable.current < 0.7 * this.cable.ampacity) {
				color = {r: 255, g: 252, b: 0};
				ctx.lineWidth = 1;
			} else if (this.cable.current < 0.8 * this.cable.ampacity){
				color = {r: 255, g: 127, b: 0};
				ctx.lineWidth = 2;
			} else if (this.cable.current < 0.9 * this.cable.ampacity){
				color = {r: 255, g: 63, b: 0};
				ctx.lineWidth = 2;
			} else if (this.cable.current < 1 * this.cable.ampacity){
				color = {r: 255, g: 0, b: 0};
				ctx.lineWidth = 2;
			}
			
			ctx.fillStyle = colorToHex(color);
			ctx.fill();
			ctx.stroke();
		}
	}
}
