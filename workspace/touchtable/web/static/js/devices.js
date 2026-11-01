    var angleScale = {
		angle: 0,
		scale: 1
	}
	
	var zmax = 100;
	
	function dragMoveListener (event) {
        //console.log('dragMoveListener');
        var target = event.target
            // keep the dragged position in the data-x/data-y attributes
            x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx,
            y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;
			s = (parseFloat(target.getAttribute('data-s')) || 100);
			z = (parseFloat(target.getAttribute('data-z')) || 1);
			if (event.scale) {
				//console.log(event.scale)
				s = s * (1+(event.ds));
				z = z * event.scale;
				z = Math.max(0.66, Math.min(2.0, z));
				//console.log(s)
			}
		
		dist = ((1080 - (z*60)) / 2) - (y+510);
		rotation = (0.5 * Math.PI) + dist / (1080 / 12);
		rotation = Math.max(0, Math.min(Math.PI, rotation));
		
		
		
        // translate the element
		if (target.classList.contains("ev") || target.classList.contains("bat") || target.classList.contains("pv") || target.classList.contains("hp")) {
        target.style.webkitTransform =
            target.style.transform =
                'translate(' + x + 'px, ' + y + 'px) scale('+z+ ') rotate('+rotation+'rad)'; 
		}
		else {
			target.style.webkitTransform =
				target.style.transform =
					'translate(' + x + 'px, ' + y + 'px) rotate('+rotation+'rad)'; 
			z = 1.0;
		}
		
		m = (parseFloat(target.getAttribute('data-moved')) || 0);
		if (m == 0) {
			board = document.getElementById("board");
			var div = document.createElement('div');
			board.appendChild(div)
			div.className = target.className;
			div.id = uuidv4();
			
			//copy the rest
			for (var i = 0; i < target.childNodes.length; i++) {
				if (target.childNodes[i].className == "power" || target.childNodes[i].className == "soc" || target.childNodes[i].className == "socback") {
					var e = document.createElement('div');
					e.className = target.childNodes[i].className;
					div.appendChild(e)
				}
				if (target.childNodes[i].className == "devicon") {
					var e = document.createElement('img');
					e.src = target.childNodes[i].src;
					e.className = target.childNodes[i].className;
					div.appendChild(e)
				}
			}	
			//and we should have a new object ;)
			
		}

        // update the position attributes
        target.setAttribute('data-x', x);
		target.setAttribute('data-y', y);
		target.setAttribute('data-s', s);
		target.setAttribute('data-r', rotation);
		target.setAttribute('data-moved', 1);
		target.setAttribute('data-idle', 0);
		//target.setAttribute('data-z', z);
		
		//z-index hack to make things appear on top ;)
		target.style.zIndex = zmax+1;
		zmax = zmax+1;
		
		p = Math.round(s)
    }
    
	function idle(name) {
		let e = document.getElementById(name)
		if (e) {
			let currentHouse = (parseInt(e.getAttribute('data-house')));
				if (isNaN(currentHouse)) {
					let opacity = (parseInt(e.getAttribute('data-opacity')));
					if (isNaN(opacity)) {
						opacity = 100;
					}
					opacity = opacity - 1;
					e.style.opacity = opacity/100.0;
					if (opacity < 0 ) {
						e.remove();
					}
					else {
						e.setAttribute('data-opacity', opacity);
						setTimeout("idle('"+name+"')", 25);
					}
					//document.getElementById("my-element").remove();
				}
		}
	}
	
    function reset () {
		scaleElement.style.webkitTransform =
			scaleElement.style.transform =
			'scale(1)'

		angleScale.angle = 0
		angleScale.scale = 1
	}
	
	// this is used later in the resizing and gesture demos
	window.dragMoveListener = dragMoveListener

    // target elements with the "draggable" class
    interact('.x')
        .draggable({
            // enable inertial throwing
            inertia: true,
            // keep the element within the area of it's parent
            restrict: {
                restriction: "parent",
                endOnly: false,
                elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
            },
            
            // enable autoScroll
            autoScroll: true,

            onstart: function (event) {
                //console.log('onstart');

            },

            // call this function on every dragmove event
            onmove: dragMoveListener,
            // call this function on every dragend event
            onend: function (event) {
            }
        })
	
	interact('.draggable')
		.gesturable({
			onstart: function (event) {
			},
		
			onmove: function (event) {
				// uses the dragMoveListener from the draggable demo above
				dragMoveListener(event)
			},
			onend: function (event) {
				console.log('onend2');
				//var scaleElement = event.target.parentElement.children[0];
				//angleScale.angle = angleScale.angle + event.angle
				//angleScale.scale = angleScale.scale * event.scale
				//angleScale.angle = angleScale.angle + event.angle
				//angleScale.scale = angleScale.scale * event.scale
				var target = event.target
				
				if (target.classList.contains("ev") || target.classList.contains("bat") || target.classList.contains("pv") || target.classList.contains("hp")) {
					z = (parseFloat(target.getAttribute('data-z')) || 1);
					z = z * event.scale
					z = Math.max(0.66, Math.min(2.0, z));				
				}
				else {
					z = 1.0;
				}
				target.setAttribute('data-z', z);
				
				let currentHouse = (parseInt(target.getAttribute('data-house')));
				if (!isNaN(currentHouse)) {
					var newProperties = {};	
						
					if (event.target.classList.contains("ev")) {
						newProperties["capacity"] = parseInt(25000 * z * z);
						newProperties["chargingPowers"] = [0, parseInt(3700 * z)];
					}
					else if (event.target.classList.contains("pv")) {
						newProperties["panels"] = parseInt(6 * z* z);
					}
					else if (event.target.classList.contains("bat")) {
						newProperties["capacity"] = parseInt(5000 * z * z);
						newProperties["chargingPowers"] = [parseInt(-3700 * z), parseInt(3700 * z)];
					}
					else if (event.target.classList.contains("hp")) {
						newProperties["capacity"] = parseInt(5000 * z * z);
						newProperties["chargingPowers"] = [0, parseInt(3700 * z)];
						newProperties["scaling"] = parseInt(3 * z);
					}
					updateSettings(target.id, newProperties);
				}
				else {
					setTimeout("idle('"+event.target.id+"')", 10000);
				}
					
			}
		})
		.draggable({
            // enable inertial throwing
            inertia: true,
            // keep the element within the area of it's parent
            restrict: {
                restriction: "parent",
                endOnly: false,
                elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
            },
            
            // enable autoScroll
            autoScroll: true,

            onstart: function (event) {
               // console.log('onstart');

            },

            // call this function on every dragmove event
            onmove: dragMoveListener,
            // call this function on every dragend event
            onend: function (event) {
                //console.log('onend');
            }
        })
		
	    .on('tap', function (event) {
			event.currentTarget.classList.toggle('switch-bg');
			//console.log('ontap');
			event.preventDefault();
		  })		
		
		
	interact('.house').dropzone({
	  // only accept elements matching this CSS selector
	  overlap: 1,

	  // listen for drop related events:

	  ondropactivate: function (event) {
		// add active dropzone feedback
		event.target.classList.add('drop-active')
	  },
	  ondragenter: function (event) {
		var draggableElement = event.relatedTarget
		var dropzoneElement = event.target

		// feedback the possibility of a drop
		dropzoneElement.classList.add('drop-target')
		draggableElement.classList.add('can-drop')
	  },
	  ondragleave: function (event) {
		// remove the drop feedback style
		event.target.classList.remove('drop-target')
		event.relatedTarget.classList.remove('can-drop')

		if (typeof prepareDeviceHouseLeave == "function") {
			prepareDeviceHouseLeave(event.relatedTarget);
		}
		
		event.relatedTarget.setAttribute('data-house', "");
		event.relatedTarget.setAttribute('data-oldhouse', ""); 
		
		//remove visibility on items
		for (var i = 0; i < event.relatedTarget.childNodes.length; i++) {
			if (event.relatedTarget.childNodes[i].className == "power" || event.relatedTarget.childNodes[i].className == "soc" || event.relatedTarget.childNodes[i].className == "socback") {
				event.relatedTarget.childNodes[i].style.visibility = "hidden";
			}
		}
		
		//remove object from demkit
		removeDeviceFromDEMKit(event.relatedTarget.id);

		if (typeof refreshGameficationUI == "function") {
			refreshGameficationUI();
		}
	  },
	  ondrop: function (event) {
		event.target.classList.remove('drop-active')
		event.target.classList.remove('drop-target')
		
		event.relatedTarget.setAttribute('data-house', event.target.id[5]);
		
		let oldHouse = (parseInt(event.relatedTarget.getAttribute('data-oldhouse')));
		let currentHouse = (parseInt(event.relatedTarget.getAttribute('data-house')));
		
		if (oldHouse != currentHouse) {
			if (!isNaN(currentHouse)) {
				if (typeof canDropDeviceToHouse == "function" && !canDropDeviceToHouse(event.relatedTarget, currentHouse)) {
					if (typeof rejectDeviceDrop == "function") {
						rejectDeviceDrop(event.relatedTarget);
					}
					event.relatedTarget.classList.remove('can-drop');
					return;
				}

				let device = event.relatedTarget;
				if (device.getAttribute('data-pending-add') === '1') return;

				let type = null;
				for (let option of ['ev', 'pv', 'bat', 'hp', 'wm', 'dw']) {
					if (device.classList.contains(option)) {
						type = option;
						break;
					}
				}
				if (!type) return;

				let housenumber = currentHouse;
				let scale = (parseFloat(device.getAttribute('data-z')) || 1);
				device.setAttribute('data-pending-add', '1');
				device.style.opacity = 0.6;

				addDeviceToDEMKit(type, housenumber, device.id, scale, function (success, message) {
					if (document.getElementById(device.id) !== device) return;
					device.removeAttribute('data-pending-add');
					if (!success) {
						if (typeof rejectDeviceDrop === 'function') {
							rejectDeviceDrop(device, message || 'Could not add device. Please try again.');
						}
						return;
					}

					device.style.opacity = 1;
					device.setAttribute('data-opacity', 100);
					device.setAttribute('data-oldhouse', currentHouse);

					if (typeof commitDeviceDrop === 'function') {
						commitDeviceDrop(device, housenumber);
					}

					for (var i = 0; i < device.childNodes.length; i++) {
						let child = device.childNodes[i];
						if (child.className == 'power' || child.className == 'soc' || child.className == 'socback') {
							if (child.className == 'power' || child.className == 'soc') {
								child.style.width = '0%';
							}
							child.style.visibility = 'visible';
						}
					}
				});
			}
		}
	  },
	  ondropdeactivate: function (event) {
		// remove active dropzone feedback
		event.target.classList.remove('drop-active')
		event.target.classList.remove('drop-target')

		let currentHouse = (parseInt(event.relatedTarget.getAttribute('data-house')));
		if (isNaN(currentHouse)) {
			setTimeout("idle('"+event.relatedTarget.id+"')", 10000);
		}
	  }
	})
	
    
