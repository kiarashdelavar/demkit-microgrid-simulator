const http = new XMLHttpRequest()

let intervalId = -1;
let fast = false;
let pause = true;
let controlled = 0;
const gridModes = [
	{ id: 'grid', label: 'Grid', event: 'controlOff', hint: 'Use the main power grid.' },
	{ id: 'smart', label: 'Smart', event: 'controlOn', hint: 'The app helps devices use power at the right time.' },
	{ id: 'island', label: 'Island', event: 'controlIsland', hint: 'Use only local power.' },
];
const gridModeHint = document.getElementById('gridModeHint');
gridModeHint.textContent = gridModes[controlled].hint;
let gridModeHintTimeout;

//startSim()

function setSimulationButtonState(isRunning) {
	const playButton = document.getElementById('playButton');
	if (!playButton) {
		return;
	}

	const action = isRunning ? 'Pause' : 'Play';
	intervalId = isRunning ? 500 : -1;
	pause = !isRunning;
	playButton.querySelector('.simulation-button-icon').textContent = isRunning ? '❚❚' : '▶';
	playButton.querySelector('.simulation-button-label').textContent = action;
	playButton.setAttribute('aria-label', action + ' simulation');
}

function playSimulation(event) {
	setSimulationButtonState(true);
	socket.emit('simPlay');
	if (event) {
		event.preventDefault();
	}

	return false;
}

function pauseSimulation(event) {
	setSimulationButtonState(false);
	socket.emit('simPause');
	if (event) {
		event.preventDefault();
	}

	return false;
}

function toggleSim(event) {
	if (pause) {
		return playSimulation(event);
	}

	return pauseSimulation(event);
}

function ensureSimulationPlaying() {
	return playSimulation();
}

socket.on('connect', function() {
	if (!pause) {
		socket.emit('simPlay');
	}
});

function toggleControl(event) {
	const smartButton = event.currentTarget;
	controlled = (controlled + 1) % gridModes.length;
	const mode = gridModes[controlled];
	const nextMode = gridModes[(controlled + 1) % gridModes.length];
	smartButton.dataset.mode = mode.id;
	smartButton.querySelector('.simulation-button-label').textContent = mode.label;
	smartButton.setAttribute('aria-label', `Grid mode: ${mode.label}. Change to ${nextMode.label}.`);
	gridModeHint.textContent = mode.hint;
	gridModeHint.setAttribute('data-recent', '');
	clearTimeout(gridModeHintTimeout);
	gridModeHintTimeout = setTimeout(() => gridModeHint.removeAttribute('data-recent'), 2500);
	socket.emit(mode.event);
	return false;
}

/*
function startSim(){
    intervalId = setInterval(() => {
		 doTick();
    }, 1000);
}
*/

function isPaused() {
	return intervalId == -1;
}

/*
function pauseSim() {
	let playButton = document.getElementById('playButton');
    intervalId = -1;
    playButton.innerHTML = '&#9658;';
	pause = true
	socket.emit('simPause');
}
*/
