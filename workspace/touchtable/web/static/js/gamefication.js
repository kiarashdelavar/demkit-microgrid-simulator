(function () {
	const GAMEFICATION_CONFIG = {
		startingBudget: 300,
		initialHouseSlots: 3,
		slotUpgradeCost: 10,
		prices: {
			ev: 10,
			hp: 15,
			pv: 10,
			bat: 30,
			wm: 5,
			dw: 5
		}
	};

	const MAIN_MISSION = {
		title: "Microgrid Simulation Tool",
		goal: "This is a teaching tool for learning microgrid concepts through interaction. Use the simulation to explore how local demand, solar generation, batteries, and grid limits affect a neighborhood energy system.",
		tasks: [
			"Buy and place components to create different microgrid situations.",
			"Complete short-term learning goals to earn coin rewards.",
			"Use EV chargers to observe high electricity demand.",
			"Use solar panels and batteries to explore local energy production and storage.",
			"Observe load, import/export, and overload events to understand grid constraints.",
		],
		watch: [
			"House Load %",
			"Power W",
			"Import / Export",
			"Overload warnings"
		]
	};

	const DEVICE_LABELS = {
		ev: "EV",
		hp: "Heat pump",
		pv: "Solar",
		bat: "Battery",
		wm: "Washing machine",
		dw: "Dishwasher"
	};

	const BATTERY_STRATEGIES = [
		{
			id: "solar_only",
			label: "Solar",
			message: "Battery strategy: Solar Only. It charges only from local surplus solar and does not discharge for load."
		},
		{
			id: "smart",
			label: "Smart",
			message: "Battery strategy: Smart. It stores surplus solar and discharges down to 20% when one high-power device is running."
		},
		{
			id: "manual_charge",
			label: "+",
			message: "Manual charge: the battery charges until full. This can increase transformer load."
		},
		{
			id: "manual_discharge",
			label: "-",
			message: "Manual discharge: the battery supports real house load until empty."
		}
	];

	const DEVICE_PRICE_TAGS = {
		ev: { left: 515, top: 468 },
		bat: { left: 675, top: 468 },
		pv: { left: 835, top: 468 },
		hp: { left: 995, top: 468 },
		wm: { left: 1155, top: 468 },
		dw: { left: 1315, top: 468 }
	};

	const DEVICE_MAX_POWER_LABELS = {
		ev: "Max 3.7 kW",
		bat: "+/-3.7 kW",
		pv: "Peak 1.8 kW",
		hp: "Max 3.7 kW",
		wm: "Peak 2.0 kW",
		dw: "Peak 3.1 kW"
	};

	const DEVICE_POWER_TAGS = {
		ev: { left: 515, top: 583 },
		bat: { left: 675, top: 583 },
		pv: { left: 835, top: 583 },
		hp: { left: 995, top: 583 },
		wm: { left: 1155, top: 583 },
		dw: { left: 1315, top: 583 }
	};

	const HOUSE_LOAD_CAUTION_THRESHOLD = 0.6;
	const HOUSE_LOAD_WARNING_THRESHOLD = 0.85;
	const LEARNING_GOAL_HOUSE = 1;
	const COMMUNITY_DEMAND_HOUSE = 2;
	const LEARNING_GOAL_REWARD = 100;
	const LEARNING_GOAL_COMPLETE_INDEX = 8;
	const ADDITIONAL_TASK_REWARD = 40;
	const ACTIVE_POWER_THRESHOLD_W = 500;
	const BATTERY_POWER_THRESHOLD_W = 100;
	const SMART_HIGH_POWER_DEVICE_THRESHOLD_W = 1500;
	const PEAK_SHAVING_ACTIVE_DEVICE_TYPES = ["ev", "hp", "wm", "dw"];
	const PEAK_SHAVING_ACTIVE_DEVICE_REQUIRED = 2;
	const BONUS_SOLAR_REQUIRED_PANELS = 2;
	const BONUS_HEAVY_EV_COUNT = 3;
	const NIGHT_CHARGE_FULL_SOC_PERCENT = 95;
	const NIGHT_CHARGE_PROMPT_HOUR = 22;
	const NIGHT_CHARGE_START_HOUR = 23;
	const NIGHT_CHARGE_END_HOUR = 5;
	const SOLAR_GENERATION_THRESHOLD_W = -100;
	const MAIN_PEAK_THRESHOLD_W = 1000;
	const SOLAR_EXPORT_THRESHOLD_W = -500;
	const GOAL_SOLAR_EXPORT_THRESHOLD_W = -50;
	const TRANSFORMER_EXPORT_BONUS_CURRENT_A = 5;
	const COMMUNITY_DEMAND_THRESHOLD_W = 1000;
	const BATTERY_SOC_GAIN_THRESHOLD_WH = 15;
	const GOAL_SOLAR_REQUIRED = 3;
	const GOAL_BATTERY_REQUIRED = 2;
	const LOCAL_BALANCE_POWER_THRESHOLD_W = 500;
	const LOCAL_BALANCE_REQUIRED_TICKS = 3;
	const COMMUNITY_POWER_THRESHOLD_W = 1000;
	const COMMUNITY_REQUIRED_TICKS = 3;
	const VOLTAGE_LOW_THRESHOLD_V = 225;
	const VOLTAGE_IMPROVEMENT_THRESHOLD_V = 1;
	const STREET_FEEDER_WARNING_THRESHOLD = 0.8;
	const STREET_FEEDER_FAIL_THRESHOLD = 1.0;
	const HOUSE_EVENT_WARNING_THRESHOLD = 0.85;
	const HOUSE_EVENT_FAIL_THRESHOLD = 1.0;
	const EVENT_SAFE_THRESHOLD = 0.6;
	const SOLAR_EXPORT_WARNING_CURRENT_A = 15;
	const SOLAR_EXPORT_FAIL_CURRENT_A = 20;
	const SOLAR_EXPORT_SAFE_CURRENT_A = 10;
	const STREET_FEEDER_PENALTY = 300;
	const HOUSE_OVERLOAD_PENALTY = 200;
	const SOLAR_EXPORT_PENALTY = 200;

	let budget = GAMEFICATION_CONFIG.startingBudget;
	let rewardCoinsEarned = 0;
	let budgetHistory = [];
	let houseSlots = [];
	let initialized = false;
	let budgetValueElement = null;
	let budgetHistoryElement = null;
	let messageElement = null;
	let eventPanelElement = null;
	let eventTitleElement = null;
	let eventTextElement = null;
	let timeSeasonPanelElement = null;
	let timeSeasonTimeElement = null;
	let timeSeasonSeasonElement = null;
	let missionOverlayElement = null;
	let houseTipNotices = {};
	let learningGoalButtonElement = null;
	let learningGoalOverlayElement = null;
	let learningGoalTitleElement = null;
	let learningGoalTextElement = null;
	let learningGoalProgressElement = null;
	let learningGoalLearningElement = null;
	let learningGoalAdditionalElement = null;
	let learningGoalAdditionalTextElement = null;
	let learningGoalAdditionalRewardElement = null;
	let learningGoalAdditionalActionElement = null;
	let learningGoalRewardElement = null;
	let learningGoalActionElement = null;
	let transformerStatusElement = null;
	let activeLearningGoal = 1;
	let currentLearningGoalClaim = null;
	let viewedLearningGoal = null;
	let learningGoalStartState = null;
	let learningGoalPlacementCount = 0;
	let learningGoalPlacementTypes = {};
	let learningGoalLastPlacementHouse = null;
	let activeAdditionalTask = null;
	let claimableAdditionalTask = null;
	let nightChargeBonusLocks = {};
	let batteryStrategyChangeCount = 0;
	let goal5StrategyStartCount = null;
	let goal1Awarded = false;
	let goal2Awarded = false;
	let goal3Awarded = false;
	let goal4Awarded = false;
	let goal5Awarded = false;
	let goal6Awarded = false;
	let goal7Awarded = false;
	let goal2MinBatterySoc = null;
	let eventFailureLocks = {
		street: false,
		house: false,
		solar: false
	};
	let eventPenaltyNotice = null;
	let eventPenaltyNoticeExpiresAt = 0;

	function houseCount() {
		return typeof NUMBER_OF_HOUSES == "number" ? NUMBER_OF_HOUSES : 6;
	}

	function getDeviceType(device) {
		return Object.keys(GAMEFICATION_CONFIG.prices).find(type => device.classList.contains(type));
	}

	function getDevicePrice(device) {
		let type = getDeviceType(device);
		return type ? GAMEFICATION_CONFIG.prices[type] : 0;
	}

	function isPurchased(device) {
		return device.getAttribute("data-game-purchased") == "1";
	}

	function getHouseDeviceCount(houseNumber, ignoredDevice) {
		let count = 0;

		document.querySelectorAll(".draggable").forEach(device => {
			if (device == ignoredDevice) {
				return;
			}

			let deviceHouse = parseInt(device.getAttribute("data-house"), 10);
			if (deviceHouse == houseNumber) {
				count += 1;
			}
		});

		return count;
	}

	function getHouseDevices(houseNumber) {
		return Array.from(document.querySelectorAll(".draggable")).filter(device => {
			let deviceHouse = parseInt(device.getAttribute("data-house"), 10);
			return deviceHouse == houseNumber;
		});
	}

	function houseHasDevice(houseNumber, type) {
		return getHouseDevices(houseNumber).some(device => device.classList.contains(type));
	}

	function getHouseDevicesByType(houseNumber, type) {
		return getHouseDevices(houseNumber).filter(device => device.classList.contains(type));
	}

	function getDemDeviceState(device) {
		if (!device || typeof DEMData == "undefined" || !DEMData || !Array.isArray(DEMData.devices)) {
			return null;
		}

		return DEMData.devices.find(deviceState => deviceState.name == device.id) || null;
	}

	function getHouseConnectionCable(houseNumber) {
		if (typeof findHouseConnectionCable == "function") {
			return findHouseConnectionCable(houseNumber);
		}

		if (typeof network == "undefined" || !network || !Array.isArray(network.cables)) {
			return null;
		}

		let connectionName = "houseconnection-" + houseNumber;
		return network.cables.find(cable => cable.nodes.some(node => node.name == connectionName));
	}

	function getHouseVoltage(houseNumber) {
		if (typeof network == "undefined" || !network || typeof network.getNode != "function") {
			return null;
		}

		let node = network.getNode("houseconnection-" + houseNumber);
		if (!node) {
			return null;
		}

		let voltage = Number(node.voltage);
		return Number.isFinite(voltage) ? voltage : null;
	}

	function getHouseLoadInfo(houseNumber) {
		let cable = getHouseConnectionCable(houseNumber);

		if (!cable || !cable.ampacity || cable.ampacity <= 0) {
			return {
				current: 0,
				maxCurrent: 0,
				loadRatio: 0,
				remainingRatio: 1,
				burned: false
			};
		}

		let current = Number(cable.current);
		if (!Number.isFinite(current)) {
			current = 0;
		}

		let loadRatio = Math.abs(current) / cable.ampacity;
		return {
			current: Math.abs(current),
			maxCurrent: cable.ampacity,
			loadRatio: loadRatio,
			remainingRatio: Math.max(0, 1 - loadRatio),
			burned: cable.burned
		};
	}

	function getTransformerCable() {
		if (typeof network == "undefined" || !network || !Array.isArray(network.cables)) {
			return null;
		}

		return network.cables.find(cable => {
			if (!Array.isArray(cable.nodes)) {
				return false;
			}

			let nodeNames = cable.nodes.map(node => node.name);
			return nodeNames.includes("transformer") && nodeNames.includes("feeder-0");
		}) || network.cables.find(cable => cable.name == "LVCable-0") || null;
	}

	function getTransformerLoadInfo() {
		let cable = getTransformerCable();

		if (!cable || !cable.ampacity || cable.ampacity <= 0) {
			return {
				current: 0,
				signedCurrent: 0,
				maxCurrent: 0,
				loadRatio: 0,
				burned: false
			};
		}

		let current = Number(cable.current);
		if (!Number.isFinite(current)) {
			current = 0;
		}

		let direction = Number(cable.direction);
		if (!Number.isFinite(direction) || direction == 0) {
			direction = 1;
		}

		return {
			current: Math.abs(current),
			signedCurrent: Math.abs(current) * direction,
			maxCurrent: cable.ampacity,
			loadRatio: Math.abs(current) / cable.ampacity,
			burned: cable.burned
		};
	}

	function getStreetFeederCables() {
		if (typeof network == "undefined" || !network || !Array.isArray(network.cables)) {
			return [];
		}

		return network.cables.filter(cable => {
			if (!Array.isArray(cable.nodes)) {
				return false;
			}

			let nodeNames = cable.nodes.map(node => node.name);
			let isFeederCable = nodeNames.every(name => name.indexOf("feeder") === 0);
			let isHouseConnectionCable = nodeNames.some(name => name.indexOf("houseconnection-") === 0);
			return isFeederCable && !isHouseConnectionCable && cable.name != "LVCable-0";
		});
	}

	function getHighestStreetFeederLoad() {
		let highest = null;

		getStreetFeederCables().forEach(cable => {
			if (highest && highest.burned) {
				return;
			}

			let current = Number(cable.current);
			if (!Number.isFinite(current)) {
				current = 0;
			}

			let loadRatio = cable.ampacity > 0 ? Math.abs(current) / cable.ampacity : 0;
			let reading = {
				name: cable.name,
				current: Math.abs(current),
				maxCurrent: cable.ampacity || 0,
				loadRatio: loadRatio,
				burned: cable.burned
			};

			if (reading.burned) {
				highest = reading;
				return;
			}

			if (!highest || reading.loadRatio > highest.loadRatio) {
				highest = reading;
			}
		});

		return highest;
	}

	function getHighestHouseLoad() {
		let highest = null;

		for (let houseNumber = 0; houseNumber < houseCount(); houseNumber++) {
			let loadInfo = getHouseLoadInfo(houseNumber);
			let reading = {
				houseNumber: houseNumber,
				current: loadInfo.current,
				maxCurrent: loadInfo.maxCurrent,
				loadRatio: loadInfo.loadRatio,
				burned: loadInfo.burned
			};

			if (reading.burned) {
				return reading;
			}

			if (!highest || reading.loadRatio > highest.loadRatio) {
				highest = reading;
			}
		}

		return highest;
	}

	function readElectricPowerWatts(deviceState) {
		if (!deviceState || !deviceState.consumption || deviceState.consumption.ELECTRICITY == undefined) {
			return null;
		}

		let power = deviceState.consumption.ELECTRICITY;
		if (power && power.real != undefined) {
			power = power.real;
		}

		power = Number(power);
		return Number.isFinite(power) ? power : null;
	}

	function getDevicePowerWatts(device) {
		return readElectricPowerWatts(getDemDeviceState(device));
	}

	function getDeviceSocWh(device) {
		let deviceState = getDemDeviceState(device);
		if (!deviceState || deviceState.soc == undefined || deviceState.capacity == undefined) {
			return null;
		}

		let soc = Number(deviceState.soc);
		let capacity = Number(deviceState.capacity);
		if (!Number.isFinite(soc) || !Number.isFinite(capacity) || capacity <= 0) {
			return null;
		}

		return {
			soc: soc,
			capacity: capacity
		};
	}

	function getBatteryStrategyInfo(strategyId) {
		return BATTERY_STRATEGIES.find(strategy => strategy.id == strategyId) || BATTERY_STRATEGIES[0];
	}

	function getBatteryStrategy(device) {
		let deviceState = getDemDeviceState(device);
		let strategy = deviceState && deviceState.gridChargingStrategy ? deviceState.gridChargingStrategy : device.getAttribute("data-battery-strategy");
		return getBatteryStrategyInfo(strategy).id;
	}

	function houseHasBatteryStrategy(houseNumber, strategyId) {
		return getHouseDevicesByType(houseNumber, "bat").some(device => getBatteryStrategy(device) == strategyId);
	}

	function isHouseBatteryDischargingWithStrategy(houseNumber, strategyId) {
		return getHouseDevicesByType(houseNumber, "bat").some(device => {
			let power = getDevicePowerWatts(device);
			return getBatteryStrategy(device) == strategyId && power !== null && power < -BATTERY_POWER_THRESHOLD_W;
		});
	}

	function getBatteryStrategyProperties(strategyId, scale) {
		let scaled = Number.isFinite(scale) && scale > 0 ? scale : 1;
		let properties = {
			gridChargingStrategy: strategyId
		};

		if (strategyId == "smart") {
			properties.gridReserveTargetSoc = 0.80;
			properties.smartDischargeFloorSoc = 0.20;
			properties.gridChargePowerLimit = parseInt(1000 * scaled);
			properties.gridChargeLoadThreshold = parseInt(1000 * scaled);
			properties.smartHighLoadThreshold = parseInt(SMART_HIGH_POWER_DEVICE_THRESHOLD_W * scaled);
		}
		else if (strategyId == "reserve") {
			properties.gridChargingStrategy = "manual_charge";
			properties.manualChargePowerLimit = parseInt(1000 * scaled);
			properties.manualDischargePowerLimit = parseInt(1850 * scaled);
		}
		else if (strategyId == "manual_charge") {
			properties.manualChargePowerLimit = parseInt(1000 * scaled);
		}
		else if (strategyId == "manual_discharge") {
			properties.manualDischargePowerLimit = parseInt(1850 * scaled);
		}

		return properties;
	}

	function getBatterySourceLabel(source, blocked) {
		if (blocked) {
			return "Block";
		}

		let labels = {
			solar: "Solar",
			grid: "Grid",
			discharging: "Disch",
			idle: "Idle"
		};

		return labels[source] || "Idle";
	}

	function getDeviceRotationRadians(device) {
		let storedRotation = parseFloat(device.getAttribute("data-r"));
		if (Number.isFinite(storedRotation)) {
			return storedRotation;
		}

		let transform = device.style.transform || window.getComputedStyle(device).transform;
		if (!transform || transform == "none") {
			return 0;
		}

		let matrixMatch = transform.match(/^matrix\((.+)\)$/);
		if (matrixMatch) {
			let values = matrixMatch[1].split(",").map(value => parseFloat(value));
			if (values.length >= 2 && Number.isFinite(values[0]) && Number.isFinite(values[1])) {
				return Math.atan2(values[1], values[0]);
			}
		}

		let matrix3dMatch = transform.match(/^matrix3d\((.+)\)$/);
		if (matrix3dMatch) {
			let values = matrix3dMatch[1].split(",").map(value => parseFloat(value));
			if (values.length >= 2 && Number.isFinite(values[0]) && Number.isFinite(values[1])) {
				return Math.atan2(values[1], values[0]);
			}
		}

		return 0;
	}

	function setBatteryStrategy(device, strategyId) {
		let strategy = getBatteryStrategyInfo(strategyId);
		device.setAttribute("data-battery-strategy", strategy.id);
		if (strategy.id == "solar_only" || strategy.id == "smart") {
			device.setAttribute("data-battery-auto-strategy", strategy.id);
		}
		batteryStrategyChangeCount += 1;

		if (typeof updateSettings == "function") {
			let scale = parseFloat(device.getAttribute("data-z")) || 1;
			updateSettings(device.id, getBatteryStrategyProperties(strategy.id, scale));
		}

		setMessage("");
		refreshGameficationUI();
	}

	function toggleBatteryAutoStrategy(device) {
		let currentStrategy = getBatteryStrategy(device);
		setBatteryStrategy(device, currentStrategy == "smart" ? "solar_only" : "smart");
	}

	function getBatteryAutoStrategy(device) {
		let storedStrategy = device.getAttribute("data-battery-auto-strategy");
		return storedStrategy == "smart" ? "smart" : "solar_only";
	}

	function toggleManualBatteryStrategy(device, manualStrategyId) {
		let currentStrategy = getBatteryStrategy(device);
		if (currentStrategy == manualStrategyId) {
			setBatteryStrategy(device, getBatteryAutoStrategy(device));
			return;
		}

		if (currentStrategy == "solar_only" || currentStrategy == "smart") {
			device.setAttribute("data-battery-auto-strategy", currentStrategy);
		}
		setBatteryStrategy(device, manualStrategyId);
	}

	function stopBatteryControlEvent(event) {
		event.preventDefault();
		event.stopPropagation();
	}

	function stopBatteryControlPointerEvent(event) {
		event.stopPropagation();
	}

	function createBatteryStrategyButton(className, label, title, clickHandler) {
		let button = document.createElement("button");
		button.type = "button";
		button.className = className;
		button.textContent = label;
		button.title = title;
		button.addEventListener("pointerdown", stopBatteryControlPointerEvent);
		button.addEventListener("mousedown", stopBatteryControlPointerEvent);
		button.addEventListener("touchstart", stopBatteryControlPointerEvent);
		button.addEventListener("click", function (event) {
			stopBatteryControlEvent(event);
			clickHandler();
		});
		return button;
	}

	function createBatteryStrategyControls(device) {
		let oldBadge = Array.from(device.children).find(child => child.classList.contains("battery-strategy-badge"));
		if (oldBadge && oldBadge.parentNode) {
			oldBadge.parentNode.removeChild(oldBadge);
		}

		let controls = document.createElement("div");
		controls.className = "battery-strategy-controls";

		controls.appendChild(createBatteryStrategyButton(
			"battery-strategy-button battery-strategy-manual battery-strategy-charge",
			"+",
			"Manual charge this battery. Tap again to return to the previous Solar/Smart mode.",
			function () {
				toggleManualBatteryStrategy(device, "manual_charge");
			}
		));

		controls.appendChild(createBatteryStrategyButton(
			"battery-strategy-button battery-strategy-badge battery-strategy-mode",
			"Solar",
			"Toggle between Solar and Smart battery control.",
			function () {
				toggleBatteryAutoStrategy(device);
			}
		));

		controls.appendChild(createBatteryStrategyButton(
			"battery-strategy-button battery-strategy-manual battery-strategy-discharge",
			"-",
			"Manual discharge this battery. Tap again to return to the previous Solar/Smart mode.",
			function () {
				toggleManualBatteryStrategy(device, "manual_discharge");
			}
		));

		device.appendChild(controls);
		return controls;
	}

	function ensureBatteryStrategyControls() {
		document.querySelectorAll(".draggable.bat").forEach(device => {
			let houseNumber = parseInt(device.getAttribute("data-house"), 10);
			let controls = device.querySelector(".battery-strategy-controls") || createBatteryStrategyControls(device);
			let badge = controls.querySelector(".battery-strategy-badge");
			let chargeButton = controls.querySelector(".battery-strategy-charge");
			let dischargeButton = controls.querySelector(".battery-strategy-discharge");

			let strategy = getBatteryStrategyInfo(getBatteryStrategy(device));
			let deviceState = getDemDeviceState(device);
			let source = deviceState && deviceState.gridChargingSource ? deviceState.gridChargingSource : "idle";
			let blocked = deviceState && deviceState.gridChargingBlocked;
			let sourceLabel = getBatterySourceLabel(source, blocked);
			badge.textContent = strategy.label + " " + sourceLabel;
			badge.title = strategy.message + " Current state: " + sourceLabel + ".";
			controls.dataset.strategy = strategy.id;
			controls.dataset.source = blocked ? "blocked" : source;
			badge.dataset.strategy = strategy.id;
			badge.dataset.source = blocked ? "blocked" : source;
			chargeButton.dataset.active = strategy.id == "manual_charge" ? "1" : "0";
			dischargeButton.dataset.active = strategy.id == "manual_discharge" ? "1" : "0";
			controls.style.transform = "translateX(-50%) rotate(" + (-getDeviceRotationRadians(device)) + "rad)";
			controls.style.display = isNaN(houseNumber) ? "none" : "flex";
		});
	}

	function getHouseBatteryMetrics(houseNumber) {
		let batteries = getHouseDevicesByType(houseNumber, "bat");
		let totalSoc = 0;
		let totalCapacity = 0;
		let anyCharging = false;
		let anySolarCharging = false;
		let anyGridCharging = false;
		let anyGridChargingBlocked = false;
		let anyDischarging = false;
		let hasSoc = false;

		batteries.forEach(device => {
			let power = getDevicePowerWatts(device);
			let deviceState = getDemDeviceState(device);
			let source = deviceState && deviceState.gridChargingSource ? deviceState.gridChargingSource : null;
			if (power !== null) {
				if (power > BATTERY_POWER_THRESHOLD_W) {
					anyCharging = true;
					if (source == "solar") {
						anySolarCharging = true;
					}
					else if (source == "grid") {
						anyGridCharging = true;
					}
				}
				else if (power < -BATTERY_POWER_THRESHOLD_W) {
					anyDischarging = true;
				}
			}

			if (deviceState && deviceState.gridChargingBlocked) {
				anyGridChargingBlocked = true;
			}

			let socInfo = getDeviceSocWh(device);
			if (socInfo) {
				totalSoc += socInfo.soc;
				totalCapacity += socInfo.capacity;
				hasSoc = true;
			}
		});

		return {
			count: batteries.length,
			totalSoc: totalSoc,
			totalCapacity: totalCapacity,
			socPercent: hasSoc && totalCapacity > 0 ? (totalSoc / totalCapacity) * 100 : null,
			anyCharging: anyCharging,
			anySolarCharging: anySolarCharging,
			anyGridCharging: anyGridCharging,
			anyGridChargingBlocked: anyGridChargingBlocked,
			anyDischarging: anyDischarging,
			hasSoc: hasSoc
		};
	}

	function getPlacedBatteryCount() {
		return Array.from(document.querySelectorAll(".draggable.bat")).filter(device => {
			return !isNaN(parseInt(device.getAttribute("data-house"), 10));
		}).length;
	}

	function getPlacedDeviceCountByType(type) {
		return Array.from(document.querySelectorAll(".draggable." + type)).filter(device => {
			return !isNaN(parseInt(device.getAttribute("data-house"), 10));
		}).length;
	}

	function getHouseLabel(houseNumber) {
		return "House " + (houseNumber + 1);
	}

	function getFirstHouseWithDeviceType(type) {
		for (let houseNumber = 0; houseNumber < houseCount(); houseNumber++) {
			if (getHouseDevicesByType(houseNumber, type).length > 0) {
				return houseNumber;
			}
		}

		return null;
	}

	function getBestBatteryHouseForBonus() {
		let best = null;

		for (let houseNumber = 0; houseNumber < houseCount(); houseNumber++) {
			let batteryMetrics = getHouseBatteryMetrics(houseNumber);
			if (batteryMetrics.count == 0) {
				continue;
			}

			let power = getHousePowerWatts(houseNumber, getHouseLoadInfo(houseNumber));
			if (!best || power > best.power) {
				best = {
					houseNumber: houseNumber,
					power: power
				};
			}
		}

		return best;
	}

	function getSolarBatteryHouseForBonus() {
		for (let houseNumber = 0; houseNumber < houseCount(); houseNumber++) {
			if (getHouseBatteryMetrics(houseNumber).count > 0 && houseHasDevice(houseNumber, "pv")) {
				return houseNumber;
			}
		}

		return null;
	}

	function getSolarHouseForBonus() {
		let exporter = getStrongestSolarExportReading();
		if (exporter) {
			return exporter.houseNumber;
		}

		return getFirstHouseWithDeviceType("pv");
	}

	function getHouseBatteryStrategySignature(houseNumber) {
		return getHouseDevicesByType(houseNumber, "bat").map(device => {
			return device.id + ":" + getBatteryStrategy(device);
		}).join("|");
	}

	function getHeavyLoadNoSolarBonusHouse() {
		let best = null;

		for (let houseNumber = 0; houseNumber < houseCount(); houseNumber++) {
			let solarCount = getHouseDevicesByType(houseNumber, "pv").length;
			if (solarCount > 0) {
				continue;
			}

			let evCount = getHouseDevicesByType(houseNumber, "ev").length;
			let hasFlexibleStack = evCount >= 1 &&
				getHouseDevicesByType(houseNumber, "hp").length > 0 &&
				getHouseDevicesByType(houseNumber, "dw").length > 0 &&
				getHouseDevicesByType(houseNumber, "wm").length > 0;

			if (evCount < BONUS_HEAVY_EV_COUNT && !hasFlexibleStack) {
				continue;
			}

			let power = getHousePowerWatts(houseNumber, getHouseLoadInfo(houseNumber));
			if (!best || evCount > best.evCount || power > best.power) {
				best = {
					houseNumber: houseNumber,
					evCount: evCount,
					hasFlexibleStack: hasFlexibleStack,
					power: power
				};
			}
		}

		return best;
	}

	function getNonSmartBatteryBonusHouse() {
		for (let houseNumber = 0; houseNumber < houseCount(); houseNumber++) {
			let batteries = getHouseDevicesByType(houseNumber, "bat");
			if (batteries.length == 0) {
				continue;
			}

			if (!batteries.some(device => getBatteryStrategy(device) == "smart")) {
				return houseNumber;
			}
		}

		return null;
	}

	function getSolarSurplusNoBatteryBonusHouse() {
		let best = null;

		for (let houseNumber = 0; houseNumber < houseCount(); houseNumber++) {
			if (!houseHasDevice(houseNumber, "pv") || getHouseBatteryMetrics(houseNumber).count > 0) {
				continue;
			}

			let reading = getHousePowerReading(houseNumber);
			if (reading.power < GOAL_SOLAR_EXPORT_THRESHOLD_W && (!best || reading.power < best.power)) {
				best = reading;
			}
		}

		return best ? best.houseNumber : null;
	}

	function isNightChargePromptWindow() {
		let date = getSimulationDate();
		if (!date) {
			return false;
		}

		let hour = date.getHours();
		return hour >= NIGHT_CHARGE_PROMPT_HOUR || hour < NIGHT_CHARGE_END_HOUR;
	}

	function isNightChargeWindow() {
		let date = getSimulationDate();
		if (!date) {
			return false;
		}

		let hour = date.getHours();
		return hour >= NIGHT_CHARGE_START_HOUR || hour < NIGHT_CHARGE_END_HOUR;
	}

	function getNightChargeBonusHouse() {
		if (!isNightChargePromptWindow()) {
			nightChargeBonusLocks = {};
			return null;
		}

		let best = null;

		for (let houseNumber = 0; houseNumber < houseCount(); houseNumber++) {
			let batteryMetrics = getHouseBatteryMetrics(houseNumber);
			if (batteryMetrics.count == 0 || batteryMetrics.socPercent === null || batteryMetrics.socPercent >= NIGHT_CHARGE_FULL_SOC_PERCENT) {
				delete nightChargeBonusLocks[houseNumber];
				continue;
			}

			if (nightChargeBonusLocks[houseNumber]) {
				continue;
			}

			if (getActivePeakLoadDevices(houseNumber).length > 0) {
				continue;
			}

			if (!best || batteryMetrics.socPercent < best.socPercent) {
				best = {
					houseNumber: houseNumber,
					socPercent: batteryMetrics.socPercent
				};
			}
		}

		return best;
	}

	function isNightChargeBonusStillValid(houseNumber) {
		let batteryMetrics = getHouseBatteryMetrics(houseNumber);
		return isNightChargePromptWindow() &&
			batteryMetrics.count > 0 &&
			batteryMetrics.socPercent !== null &&
			batteryMetrics.socPercent < NIGHT_CHARGE_FULL_SOC_PERCENT &&
			getActivePeakLoadDevices(houseNumber).length == 0 &&
			!nightChargeBonusLocks[houseNumber];
	}

	function getAllBatteryMetrics() {
		let result = {
			count: 0,
			anyCharging: false,
			anySolarCharging: false,
			anyGridCharging: false,
			anyGridChargingBlocked: false,
			anyDischarging: false
		};

		for (let houseNumber = 0; houseNumber < houseCount(); houseNumber++) {
			let metrics = getHouseBatteryMetrics(houseNumber);
			result.count += metrics.count;
			result.anyCharging = result.anyCharging || metrics.anyCharging;
			result.anySolarCharging = result.anySolarCharging || metrics.anySolarCharging;
			result.anyGridCharging = result.anyGridCharging || metrics.anyGridCharging;
			result.anyGridChargingBlocked = result.anyGridChargingBlocked || metrics.anyGridChargingBlocked;
			result.anyDischarging = result.anyDischarging || metrics.anyDischarging;
		}

		return result;
	}

	function getAdditionalTaskCandidates(context) {
		let candidates = [];

		let heavyLoadHouse = getHeavyLoadNoSolarBonusHouse();
		if (heavyLoadHouse) {
			let houseNumber = heavyLoadHouse.houseNumber;
			let houseLabel = getHouseLabel(houseNumber);
			candidates.push({
				title: houseLabel + ": add solar support",
				reward: ADDITIONAL_TASK_REWARD + 20,
				houseNumber: houseNumber,
				getText: function () {
					let solarCount = getHouseDevicesByType(this.houseNumber, "pv").length;
					if (solarCount == 0) {
						return houseLabel + " has high load and no solar. Add 2 solar panels.";
					}
					if (solarCount == 1) {
						return houseLabel + " has 1 solar panel. One may not be enough. Add one more.";
					}
					return houseLabel + " has 2 solar panels. Claim the bonus.";
				},
				isComplete: function () {
					return getHouseDevicesByType(this.houseNumber, "pv").length >= BONUS_SOLAR_REQUIRED_PANELS;
				}
			});
		}

		let nightChargeHouse = getNightChargeBonusHouse();
		if (nightChargeHouse) {
			let houseNumber = nightChargeHouse.houseNumber;
			let houseLabel = getHouseLabel(houseNumber);
			candidates.push({
				title: houseLabel + ": night grid charge",
				id: "night_grid_charge",
				reward: ADDITIONAL_TASK_REWARD + 10,
				houseNumber: houseNumber,
				getText: function () {
					let metrics = getHouseBatteryMetrics(this.houseNumber);
					let socText = metrics.socPercent === null ? "" : " Current battery is " + Math.round(metrics.socPercent) + "%.";
					if (!isNightChargeWindow()) {
						return houseLabel + " battery is not full." + socText + " Wait until after 23:00, then press '+' to manually charge toward full.";
					}
					return houseLabel + " battery is not full." + socText + " Press '+' now to manually charge from the grid while load is low.";
				},
				isStillValid: function () {
					return isNightChargeBonusStillValid(this.houseNumber);
				},
				isComplete: function () {
					return isNightChargeWindow() &&
						getActivePeakLoadDevices(this.houseNumber).length == 0 &&
						houseHasBatteryStrategy(this.houseNumber, "manual_charge");
				}
			});
		}

		let nonSmartBatteryHouse = getNonSmartBatteryBonusHouse();
		if (nonSmartBatteryHouse !== null) {
			let houseNumber = nonSmartBatteryHouse;
			let houseLabel = getHouseLabel(houseNumber);
			candidates.push({
				title: houseLabel + ": use Smart mode",
				text: houseLabel + " battery should use Smart mode. Smart stores surplus solar and saves energy for high-power loads.",
				reward: ADDITIONAL_TASK_REWARD,
				houseNumber: houseNumber,
				isComplete: function () {
					return houseHasBatteryStrategy(this.houseNumber, "smart");
				}
			});
		}

		let solarSurplusHouse = getSolarSurplusNoBatteryBonusHouse();
		if (solarSurplusHouse !== null) {
			let houseLabel = getHouseLabel(solarSurplusHouse);
			candidates.push({
				title: houseLabel + ": add battery storage",
				text: houseLabel + " has extra solar but no battery. Add a battery to store surplus solar.",
				reward: ADDITIONAL_TASK_REWARD,
				houseNumber: solarSurplusHouse,
				isComplete: function () {
					return getHouseBatteryMetrics(this.houseNumber).count > 0;
				}
			});
		}

		return candidates;
	}

	function updateAdditionalTask(context) {
		if (activeLearningGoal < LEARNING_GOAL_COMPLETE_INDEX) {
			activeAdditionalTask = null;
			claimableAdditionalTask = null;
			return;
		}

		if (claimableAdditionalTask) {
			return;
		}

		if (activeAdditionalTask) {
			if (activeAdditionalTask.isComplete && activeAdditionalTask.isComplete()) {
				claimableAdditionalTask = activeAdditionalTask;
				activeAdditionalTask = null;
				return;
			}

			if (!activeAdditionalTask.isStillValid || activeAdditionalTask.isStillValid()) {
				return;
			}

			activeAdditionalTask = null;
		}

		let candidates = getAdditionalTaskCandidates(context);
		if (candidates.length == 0) {
			return;
		}

		activeAdditionalTask = candidates[0];
	}

	function claimAdditionalTask() {
		if (!claimableAdditionalTask) {
			return false;
		}

		let task = claimableAdditionalTask;
		claimableAdditionalTask = null;
		if (task.id == "night_grid_charge") {
			nightChargeBonusLocks[task.houseNumber] = true;
		}
		changeBudget("Additional bonus: " + task.title, task.reward);
		showRewardBurst("+" + task.reward + " coins");
		setMessage("");
		refreshGameficationUI();
		return true;
	}

	function renderAdditionalTask() {
		if (!learningGoalAdditionalElement || !learningGoalAdditionalTextElement || !learningGoalAdditionalRewardElement || !learningGoalAdditionalActionElement) {
			return;
		}

		let task = claimableAdditionalTask || activeAdditionalTask;
		if (!task) {
			if (activeLearningGoal >= LEARNING_GOAL_COMPLETE_INDEX) {
				learningGoalAdditionalElement.classList.remove("hidden", "complete");
				learningGoalAdditionalTextElement.textContent = "All main goals are complete. You are the street manager now: keep playing, watch the grid, and earn bonus rewards when new side tasks appear.";
				learningGoalAdditionalRewardElement.textContent = "+0";
				learningGoalAdditionalActionElement.classList.remove("visible");
				learningGoalAdditionalActionElement.disabled = true;
				return;
			}

			learningGoalAdditionalElement.classList.add("hidden");
			learningGoalAdditionalActionElement.classList.remove("visible");
			learningGoalAdditionalActionElement.disabled = true;
			return;
		}

		learningGoalAdditionalElement.classList.remove("hidden", "complete");
		learningGoalAdditionalElement.classList.toggle("complete", !!claimableAdditionalTask);
		let taskText = typeof task.getText == "function" ? task.getText() : task.text;
		learningGoalAdditionalTextElement.textContent = task.title + ": " + taskText;
		learningGoalAdditionalRewardElement.textContent = "+" + task.reward;
		learningGoalAdditionalActionElement.textContent = "Claim +" + task.reward;
		learningGoalAdditionalActionElement.disabled = !claimableAdditionalTask;
		learningGoalAdditionalActionElement.classList.toggle("visible", !!claimableAdditionalTask);
	}

	function getSolarGenerationMetrics() {
		let panels = Array.from(document.querySelectorAll(".draggable.pv")).filter(device => {
			return !isNaN(parseInt(device.getAttribute("data-house"), 10));
		});
		let generatingPanels = [];
		let totalGeneration = 0;
		let houses = {};

		panels.forEach(device => {
			let houseNumber = parseInt(device.getAttribute("data-house"), 10);
			let power = getDevicePowerWatts(device);
			if (power !== null && power < SOLAR_GENERATION_THRESHOLD_W) {
				generatingPanels.push(device);
				totalGeneration += Math.abs(power);
				houses[houseNumber] = true;
			}
		});

		return {
			count: panels.length,
			generatingCount: generatingPanels.length,
			totalGeneration: totalGeneration,
			houseNumbers: Object.keys(houses).map(value => parseInt(value, 10))
		};
	}

	function getEvPeakReading() {
		let peak = null;

		for (let houseNumber = 0; houseNumber < houseCount(); houseNumber++) {
			if (!isHouseEvCharging(houseNumber)) {
				continue;
			}

			let power = getHousePowerWatts(houseNumber, getHouseLoadInfo(houseNumber));
			let reading = {
				houseNumber: houseNumber,
				power: power
			};

			if (!peak || reading.power > peak.power) {
				peak = reading;
			}
		}

		return peak;
	}

	function getBatteryPeakSupportReading() {
		let support = null;

		for (let houseNumber = 0; houseNumber < houseCount(); houseNumber++) {
			let batteryMetrics = getHouseBatteryMetrics(houseNumber);
			if (!batteryMetrics.anyDischarging) {
				continue;
			}

			let power = getHousePowerWatts(houseNumber, getHouseLoadInfo(houseNumber));
			let reading = {
				houseNumber: houseNumber,
				power: power,
				hasEvCharging: isHouseEvCharging(houseNumber)
			};

			if (!support || reading.power > support.power) {
				support = reading;
			}
		}

		return support;
	}

	function isHouseEvCharging(houseNumber) {
		return getHouseDevicesByType(houseNumber, "ev").some(device => {
			let power = getDevicePowerWatts(device);
			return power !== null && power > ACTIVE_POWER_THRESHOLD_W;
		});
	}

	function getHousePowerWatts(houseNumber, loadInfo) {
		if (typeof DEMData != "undefined" && DEMData && Array.isArray(DEMData.devices)) {
			let smartMeter = DEMData.devices.find(deviceState => deviceState.name == "SmartMeter-House-" + houseNumber);
			let smartMeterPower = readElectricPowerWatts(smartMeter);

			if (smartMeterPower !== null) {
				return smartMeterPower;
			}
		}

		// Before DEMKit data arrives, estimate from the house cable current.
		return loadInfo.current * 230;
	}

	function getHousePowerReading(houseNumber) {
		return {
			houseNumber: houseNumber,
			power: getHousePowerWatts(houseNumber, getHouseLoadInfo(houseNumber)),
			voltage: getHouseVoltage(houseNumber)
		};
	}

	function getCommunitySharingMetrics() {
		let exporter = null;
		let importer = null;

		for (let houseNumber = 0; houseNumber < houseCount(); houseNumber++) {
			let reading = getHousePowerReading(houseNumber);

			if (reading.power < -COMMUNITY_POWER_THRESHOLD_W && (!exporter || reading.power < exporter.power)) {
				exporter = reading;
			}

			if (reading.power > COMMUNITY_POWER_THRESHOLD_W && (!importer || reading.power > importer.power)) {
				importer = reading;
			}
		}

		return {
			exporter: exporter,
			importer: importer,
			active: exporter !== null && importer !== null && exporter.houseNumber !== importer.houseNumber
		};
	}

	function getStrongestSolarExportReading() {
		let exporter = null;

		for (let houseNumber = 0; houseNumber < houseCount(); houseNumber++) {
			if (!houseHasDevice(houseNumber, "pv")) {
				continue;
			}

			let reading = getHousePowerReading(houseNumber);
			if (reading.power < SOLAR_EXPORT_THRESHOLD_W && (!exporter || reading.power < exporter.power)) {
				exporter = reading;
			}
		}

		return exporter;
	}

	function getSmartBatteryPeakReading() {
		let support = null;

		for (let houseNumber = 0; houseNumber < houseCount(); houseNumber++) {
			if (!isHouseBatteryDischargingWithStrategy(houseNumber, "smart")) {
				continue;
			}

			let reading = getHousePowerReading(houseNumber);
			if (!support || reading.power > support.power) {
				support = reading;
			}
		}

		return support;
	}

	function getActivePeakLoadDevices(houseNumber) {
		let activeDevices = [];

		PEAK_SHAVING_ACTIVE_DEVICE_TYPES.forEach(type => {
			getHouseDevicesByType(houseNumber, type).forEach(device => {
				let power = getDevicePowerWatts(device);
				if (power !== null && power > ACTIVE_POWER_THRESHOLD_W) {
					activeDevices.push({
						type: type,
						power: power
					});
				}
			});
		});

		return activeDevices;
	}

	function getSmartPeakShavingReading() {
		let best = null;
		let bestScore = -Infinity;

		for (let houseNumber = 0; houseNumber < houseCount(); houseNumber++) {
			let hasSmartBattery = houseHasBatteryStrategy(houseNumber, "smart");
			let smartDischarging = isHouseBatteryDischargingWithStrategy(houseNumber, "smart");
			let activeDevices = getActivePeakLoadDevices(houseNumber);
			let reading = {
				houseNumber: houseNumber,
				hasSmartBattery: hasSmartBattery,
				smartDischarging: smartDischarging,
				activeDeviceCount: activeDevices.length,
				power: getHousePowerWatts(houseNumber, getHouseLoadInfo(houseNumber))
			};

			let score = (reading.smartDischarging ? 1000 : 0) +
				(reading.hasSmartBattery ? 500 : 0) +
				(reading.activeDeviceCount * 25) +
				(reading.power / 10000);

			if (!best || score > bestScore) {
				best = reading;
				bestScore = score;
			}
		}

		return best;
	}

	function isNeighborhoodStable() {
		let streetLoad = getHighestStreetFeederLoad();
		let houseLoad = getHighestHouseLoad();
		let transformerLoad = getTransformerLoadInfo();
		let reverseExportCurrent = transformerLoad.signedCurrent < 0 ? Math.abs(transformerLoad.signedCurrent) : 0;

		return (!streetLoad || (!streetLoad.burned && streetLoad.loadRatio < STREET_FEEDER_WARNING_THRESHOLD)) &&
			(!houseLoad || (!houseLoad.burned && houseLoad.loadRatio < HOUSE_EVENT_WARNING_THRESHOLD)) &&
			reverseExportCurrent < SOLAR_EXPORT_WARNING_CURRENT_A;
	}

	function getLowestVoltageReading() {
		let lowest = null;

		for (let houseNumber = 0; houseNumber < houseCount(); houseNumber++) {
			let reading = getHousePowerReading(houseNumber);
			if (reading.voltage === null) {
				continue;
			}

			if (!lowest || reading.voltage < lowest.voltage) {
				lowest = reading;
			}
		}

		return lowest;
	}

	function formatPowerWatts(powerWatts) {
		let roundedPower = Math.round(powerWatts);
		return roundedPower.toLocaleString("en-US") + " W";
	}

	function getHouseLoadTip(houseNumber, usedSlots, loadInfo) {
		let notice = houseTipNotices[houseNumber];
		if (notice && Date.now() < notice.expiresAt) {
			return notice.message;
		}
		if (notice) {
			delete houseTipNotices[houseNumber];
		}

		if (loadInfo.burned) {
			return "Cable overloaded. Click the cable to restart.";
		}

		if (loadInfo.loadRatio >= HOUSE_LOAD_WARNING_THRESHOLD) {
			return "Overload warning: Too many devices are running at once. This house may overload soon.";
		}

		if (loadInfo.loadRatio >= HOUSE_LOAD_CAUTION_THRESHOLD) {
			return "High demand: add a battery or use another house.";
		}

		if (usedSlots >= houseSlots[houseNumber]) {
			return "Slots full: upgrade or use another house.";
		}

		if ((houseHasDevice(houseNumber, "ev") || houseHasDevice(houseNumber, "hp")) && !houseHasDevice(houseNumber, "bat")) {
			return "Tip: add a battery to support peak load.";
		}

		if (houseHasDevice(houseNumber, "pv") && !houseHasDevice(houseNumber, "bat")) {
			return "Tip: add a battery to store solar energy.";
		}

		if (houseHasDevice(houseNumber, "bat") && !houseHasDevice(houseNumber, "pv")) {
			return "Tip: add solar to charge the battery locally.";
		}

		return "Tip: this house has spare capacity.";
	}

	function showHouseTipNotice(houseNumber, message, durationMs) {
		houseTipNotices[houseNumber] = {
			message: message,
			expiresAt: Date.now() + (durationMs || 2500)
		};
		refreshGameficationUI();
		window.setTimeout(refreshGameficationUI, durationMs || 2500);
	}

	function setMessage(message) {
		if (!messageElement) {
			return;
		}

		messageElement.textContent = message;
		messageElement.classList.toggle("visible", message.length > 0);
	}

	function renderBudgetHistory() {
		if (!budgetHistoryElement) {
			return;
		}

		budgetHistoryElement.innerHTML = budgetHistory.slice(0, 3).map(entry => {
			let sign = entry.change > 0 ? "+" : "";
			let changeClass = entry.change > 0 ? "income" : (entry.change < 0 ? "expense" : "neutral");
			return "<div class=\"budget-history-row\">" +
				"<span class=\"budget-history-label\">" + entry.label + "</span>" +
				"<span class=\"budget-history-change " + changeClass + "\">" + sign + entry.change + "</span>" +
				"<span class=\"budget-history-balance\">" + entry.balance + "</span>" +
				"</div>";
		}).join("");
	}

	function addBudgetHistoryEntry(label, change, balance) {
		budgetHistory.unshift({ label: label, change: change, balance: balance });
		renderBudgetHistory();
	}

	function changeBudget(label, requestedChange) {
		let previousBudget = budget;
		budget = Math.max(0, budget + requestedChange);
		let actualChange = budget - previousBudget;

		if (actualChange != 0) {
			addBudgetHistoryEntry(label, actualChange, budget);
		}
		if (budgetValueElement) {
			budgetValueElement.textContent = budget;
		}

		return { previous: previousBudget, change: actualChange, current: budget };
	}

	function setEventPanel(title, text, stateClass) {
		if (!eventPanelElement || !eventTitleElement || !eventTextElement) {
			return;
		}

		eventPanelElement.classList.remove("hidden", "warning", "penalty");
		eventPanelElement.classList.add(stateClass || "warning");
		eventTitleElement.textContent = title;
		eventTextElement.textContent = text;
	}

	function hideEventPanel() {
		if (eventPanelElement) {
			eventPanelElement.classList.add("hidden");
		}
	}

	function applyEventPenalty(eventKey, amount, message) {
		if (eventFailureLocks[eventKey]) {
			return;
		}

		let eventLabels = {
			street: "Street feeder overload",
			house: "House cable overload",
			solar: "High solar export"
		};
		let penaltyLabel = (eventLabels[eventKey] || "Event") + " penalty (cost " + amount + ")";
		let transaction = changeBudget(penaltyLabel, -amount);
		eventFailureLocks[eventKey] = true;
		eventPenaltyNotice = transaction.change == 0 ?
			message + " The budget is already 0 coins." :
			message + " Budget: " + transaction.previous + " " + transaction.change + " = " + transaction.current + " coins.";
		eventPenaltyNoticeExpiresAt = Date.now() + 9000;

		setMessage("");
	}

	function updateRiskEvents() {
		let streetLoad = getHighestStreetFeederLoad();
		let houseLoad = getHighestHouseLoad();
		let transformerLoad = getTransformerLoadInfo();
		let reverseExportCurrent = transformerLoad.signedCurrent < 0 ? Math.abs(transformerLoad.signedCurrent) : 0;

		if (!streetLoad || (!streetLoad.burned && streetLoad.loadRatio < EVENT_SAFE_THRESHOLD)) {
			eventFailureLocks.street = false;
		}
		if (!houseLoad || (!houseLoad.burned && houseLoad.loadRatio < EVENT_SAFE_THRESHOLD)) {
			eventFailureLocks.house = false;
		}
		if (reverseExportCurrent < SOLAR_EXPORT_SAFE_CURRENT_A) {
			eventFailureLocks.solar = false;
		}

		if (streetLoad && (streetLoad.burned || streetLoad.loadRatio >= STREET_FEEDER_FAIL_THRESHOLD)) {
			applyEventPenalty("street", STREET_FEEDER_PENALTY, "Street feeder overloaded. The repair cost is 300 coins.");
			setEventPanel(
				"Event: Street feeder overloaded",
				"The shared street feeder exceeded its safe current limit. The repair penalty is 300 coins. Budget cannot fall below 0.",
				"penalty"
			);
			return;
		}

		if (houseLoad && (houseLoad.burned || houseLoad.loadRatio >= HOUSE_EVENT_FAIL_THRESHOLD)) {
			applyEventPenalty("house", HOUSE_OVERLOAD_PENALTY, "House " + (houseLoad.houseNumber + 1) + " overloaded. The repair cost is 200 coins.");
			setEventPanel(
				"Event: House overload",
				"House " + (houseLoad.houseNumber + 1) + " exceeded its cable limit. The repair penalty is 200 coins. Budget cannot fall below 0.",
				"penalty"
			);
			return;
		}

		if (reverseExportCurrent >= SOLAR_EXPORT_FAIL_CURRENT_A) {
			applyEventPenalty("solar", SOLAR_EXPORT_PENALTY, "Too much solar flowed back to the transformer. The protection cost is 200 coins.");
			setEventPanel(
				"Event: Transformer export limit",
				"Too much reverse solar current is flowing to the transformer. The protection penalty is 200 coins. Budget cannot fall below 0.",
				"penalty"
			);
			return;
		}

		if (streetLoad && streetLoad.loadRatio >= STREET_FEEDER_WARNING_THRESHOLD) {
			setEventPanel(
				"Event: Street feeder overload risk",
				"Street feeder load is " + Math.round(streetLoad.loadRatio * 100) + "%. Too many buildings are using electricity at the same time. Reduce demand or buy batteries for high demand houses. If it overloads, you lose 300 coins.",
				"warning"
			);
			return;
		}

		if (houseLoad && houseLoad.loadRatio >= HOUSE_EVENT_WARNING_THRESHOLD) {
			setEventPanel(
				"Event: House overload risk",
				"House " + (houseLoad.houseNumber + 1) + " load is " + Math.round(houseLoad.loadRatio * 100) + "%. Too many devices are running together. Remove load, move devices, or buy battery to reduce the load. If it overloads, you lose 200 coins.",
				"warning"
			);
			return;
		}

		if (reverseExportCurrent >= SOLAR_EXPORT_WARNING_CURRENT_A) {
			setEventPanel(
				"Event: High solar export",
				"Solar generation is higher than the neighborhood's current demand, so " + reverseExportCurrent.toFixed(1) + " A is flowing back to the transformer. Add battery storage, or schedule useful flexible loads such as EV charging, washing machines, or dishwashers during sunny hours. If reverse current reaches " + SOLAR_EXPORT_FAIL_CURRENT_A + " A, you lose 200 coins.",
				"warning"
			);
			return;
		}

		if (eventPenaltyNotice && Date.now() < eventPenaltyNoticeExpiresAt) {
			setEventPanel("Event penalty", eventPenaltyNotice, "penalty");
			return;
		}

		hideEventPanel();
	}

	function setLearningGoalPanel(title, text, progress, stateClass, actionText, actionEnabled, learningText) {
		if (!learningGoalTitleElement || !learningGoalTextElement || !learningGoalProgressElement) {
			return;
		}

		let resolvedState = stateClass || "waiting";
		let mainGoalsComplete = activeLearningGoal >= LEARNING_GOAL_COMPLETE_INDEX;
		let goalCard = document.getElementById("gameficationLearningGoal");
		if (goalCard) {
			goalCard.classList.remove("waiting", "active", "complete", "main-complete");
			goalCard.classList.add(resolvedState);
			goalCard.classList.toggle("main-complete", mainGoalsComplete);
			goalCard.querySelectorAll(
				".gamefication-learning-kicker, .gamefication-learning-header, .gamefication-learning-text, .gamefication-learning-progress, .gamefication-learning-section"
			).forEach(element => {
				element.classList.toggle("gamefication-main-goal-hidden", mainGoalsComplete);
			});
		}
		if (learningGoalButtonElement) {
			learningGoalButtonElement.classList.remove("waiting", "active", "complete");
			learningGoalButtonElement.classList.add(resolvedState);
			updateLearningGoalButton(resolvedState);
		}

		learningGoalTitleElement.textContent = title;
		learningGoalTextElement.textContent = text;
		learningGoalProgressElement.textContent = progress;
		if (learningGoalLearningElement) {
			learningGoalLearningElement.textContent = learningText || "Complete the objective to reveal the energy lesson.";
		}
		if (learningGoalRewardElement) {
			learningGoalRewardElement.textContent = activeLearningGoal >= LEARNING_GOAL_COMPLETE_INDEX ? rewardCoinsEarned + " coins earned" : "+" + LEARNING_GOAL_REWARD + " coins";
		}

		if (learningGoalActionElement) {
			let canClaim = resolvedState == "complete" && activeLearningGoal < LEARNING_GOAL_COMPLETE_INDEX;
			learningGoalActionElement.classList.toggle("gamefication-main-goal-hidden", mainGoalsComplete);
			if (!mainGoalsComplete && (canClaim || actionText)) {
				learningGoalActionElement.textContent = canClaim ? "Claim +" + LEARNING_GOAL_REWARD : actionText;
				learningGoalActionElement.disabled = canClaim ? false : !actionEnabled;
				learningGoalActionElement.classList.add("visible");
			}
			else {
				learningGoalActionElement.classList.remove("visible");
				learningGoalActionElement.disabled = true;
			}
		}
		renderAdditionalTask();
	}

	function updateLearningGoalButton(stateClass) {
		if (!learningGoalButtonElement) {
			return;
		}

		let labelElement = learningGoalButtonElement.querySelector(".gamefication-goal-button-label");
		let rewardElement = learningGoalButtonElement.querySelector(".gamefication-goal-button-reward");
		let statusElement = learningGoalButtonElement.querySelector(".gamefication-goal-button-status");

		let label = "Grid Bonus";
		let reward = "+" + LEARNING_GOAL_REWARD;
		let status = "Goal " + activeLearningGoal;

		if (activeLearningGoal >= LEARNING_GOAL_COMPLETE_INDEX) {
			let task = claimableAdditionalTask || activeAdditionalTask;
			if (claimableAdditionalTask) {
				label = "Claim bonus";
				reward = "+" + claimableAdditionalTask.reward;
				status = "Ready";
			}
			else if (task) {
				label = "Bonus active";
				reward = "+" + task.reward;
				status = "Side quest";
			}
			else {
				label = "Bonus";
				reward = "+0";
				status = "Street manager";
			}
		}
		else if (stateClass == "complete") {
			label = "Claim reward";
			status = "Ready";
		}
		else if (!hasViewedActiveLearningGoal()) {
			label = "View goal";
			status = "Goal " + activeLearningGoal;
		}
		else if (stateClass == "active") {
			label = "Bonus active";
			status = "Goal " + activeLearningGoal;
		}

		if (labelElement) {
			labelElement.textContent = label;
		}
		if (rewardElement) {
			rewardElement.textContent = reward;
		}
		if (statusElement) {
			statusElement.textContent = status;
		}
		learningGoalButtonElement.setAttribute("aria-label", label + " " + reward + ", " + status);
	}

	function showRewardBurst(text) {
		if (!learningGoalButtonElement) {
			return;
		}

		let rect = learningGoalButtonElement.getBoundingClientRect();
		let burst = document.createElement("div");
		burst.className = "gamefication-reward-burst";
		burst.textContent = text;
		burst.style.left = (rect.left + rect.width / 2) + "px";
		burst.style.top = (rect.top - 4) + "px";
		document.body.appendChild(burst);

		window.setTimeout(function () {
			if (burst.parentNode) {
				burst.parentNode.removeChild(burst);
			}
		}, 1400);
	}

	function isCurrentLearningGoalReady() {
		return currentLearningGoalClaim && currentLearningGoalClaim.goalNumber == activeLearningGoal;
	}

	function getLearningGoalLoadCount(houseNumber) {
		return PEAK_SHAVING_ACTIVE_DEVICE_TYPES.reduce((total, type) => total + getHouseDevicesByType(houseNumber, type).length, 0);
	}

	function captureLearningGoalStartState() {
		let houseTwo = LEARNING_GOAL_HOUSE;
		let houseOne = 0;
		let houseThree = COMMUNITY_DEMAND_HOUSE;
		let houseFour = 3;
		let houseOneSolarCount = getHouseDevicesByType(houseOne, "pv").length;
		let houseOnePower = getHousePowerWatts(houseOne, getHouseLoadInfo(houseOne));

		return {
			houseTwoEvCount: getHouseDevicesByType(houseTwo, "ev").length,
			houseTwoSolarCount: getHouseDevicesByType(houseTwo, "pv").length,
			houseOneSolarCount: houseOneSolarCount,
			houseOneExporting: houseOneSolarCount > 0 && houseOnePower < GOAL_SOLAR_EXPORT_THRESHOLD_W,
			houseThreeLoadCount: getLearningGoalLoadCount(houseThree),
			houseFourLoadCount: getLearningGoalLoadCount(houseFour),
			heatPumpCount: getPlacedDeviceCountByType("hp"),
			washingMachineCount: getPlacedDeviceCountByType("wm"),
			dishwasherCount: getPlacedDeviceCountByType("dw"),
			batteryStrategyChangeCount: batteryStrategyChangeCount
		};
	}

	function hasViewedActiveLearningGoal() {
		return viewedLearningGoal == activeLearningGoal;
	}

	function getLearningGoalStartValue(key, fallbackValue) {
		if (!learningGoalStartState || learningGoalStartState[key] === undefined) {
			return fallbackValue;
		}
		return learningGoalStartState[key];
	}

	function noteActiveLearningGoalViewed() {
		if (activeLearningGoal >= LEARNING_GOAL_COMPLETE_INDEX) {
			return;
		}

		if (!hasViewedActiveLearningGoal()) {
			viewedLearningGoal = activeLearningGoal;
			learningGoalStartState = captureLearningGoalStartState();
			if (activeLearningGoal == 5) {
				goal5StrategyStartCount = learningGoalStartState.batteryStrategyChangeCount;
			}
		}
	}

	function recordLearningGoalPlacement(type, houseNumber) {
		if (!hasViewedActiveLearningGoal()) {
			return;
		}

		let matched = false;
		if (activeLearningGoal == 1) {
			matched = type == "ev" && houseNumber == LEARNING_GOAL_HOUSE;
		}
		else if (activeLearningGoal == 2) {
			matched = type == "pv" && houseNumber == LEARNING_GOAL_HOUSE;
		}
		else if (activeLearningGoal == 4) {
			matched = type == "pv" && houseNumber == 0;
		}
		else if (activeLearningGoal == 6) {
			matched = PEAK_SHAVING_ACTIVE_DEVICE_TYPES.includes(type) &&
				(houseNumber == COMMUNITY_DEMAND_HOUSE || houseNumber == 3);
		}
		else if (activeLearningGoal == 7) {
			matched = type == "hp" || type == "wm" || type == "dw";
		}

		if (!matched) {
			return;
		}

		learningGoalPlacementCount += 1;
		learningGoalPlacementTypes[type] = true;
		learningGoalLastPlacementHouse = houseNumber;
	}

	function resetLearningGoalViewState() {
		viewedLearningGoal = null;
		learningGoalStartState = null;
		learningGoalPlacementCount = 0;
		learningGoalPlacementTypes = {};
		learningGoalLastPlacementHouse = null;
		goal5StrategyStartCount = null;
	}

	function markCurrentLearningGoalReady(message) {
		if (!hasViewedActiveLearningGoal()) {
			return;
		}

		if (!isCurrentLearningGoalReady()) {
			currentLearningGoalClaim = {
				goalNumber: activeLearningGoal,
				message: message
			};
		}
	}

	function claimCurrentLearningGoal() {
		if (!isCurrentLearningGoalReady()) {
			return false;
		}

		let claim = currentLearningGoalClaim;
		currentLearningGoalClaim = null;
		awardLearningGoal(claim.goalNumber, claim.message);
		if (learningGoalOverlayElement) {
			learningGoalOverlayElement.classList.add("hidden");
		}
		refreshGameficationUI();
		return true;
	}

	function awardLearningGoal(goalNumber, message) {
		let transaction = changeBudget("Goal " + goalNumber + " reward", LEARNING_GOAL_REWARD);
		rewardCoinsEarned += LEARNING_GOAL_REWARD;
		showRewardBurst("+" + LEARNING_GOAL_REWARD + " coins");

		setMessage("");

		if (goalNumber == 1) {
			goal1Awarded = true;
			activeLearningGoal = 2;
		}
		else if (goalNumber == 2) {
			goal2Awarded = true;
			activeLearningGoal = 3;
		}
		else if (goalNumber == 3) {
			goal3Awarded = true;
			activeLearningGoal = 4;
		}
		else if (goalNumber == 4) {
			goal4Awarded = true;
			activeLearningGoal = 5;
		}
		else if (goalNumber == 5) {
			goal5Awarded = true;
			activeLearningGoal = 6;
		}
		else if (goalNumber == 6) {
			goal6Awarded = true;
			activeLearningGoal = 7;
		}
		else if (goalNumber == 7) {
			goal7Awarded = true;
			activeLearningGoal = LEARNING_GOAL_COMPLETE_INDEX;
		}

		resetLearningGoalViewState();
	}

	function updateLearningGoals() {
		if (!learningGoalTitleElement) {
			return;
		}

		let houseTwo = LEARNING_GOAL_HOUSE;
		let houseOne = 0;
		let houseThree = COMMUNITY_DEMAND_HOUSE;
		let houseFour = 3;
		let houseTwoLabel = "House " + (houseTwo + 1);
		let houseOneLabel = "House " + (houseOne + 1);
		let houseThreeLabel = "House " + (houseThree + 1);
		let houseFourLabel = "House " + (houseFour + 1);
		let houseTwoEvCount = getHouseDevicesByType(houseTwo, "ev").length;
		let houseTwoEvCharging = isHouseEvCharging(houseTwo);
		let houseTwoBatteryMetrics = getHouseBatteryMetrics(houseTwo);
		let solarMetrics = getSolarGenerationMetrics();
		let batteryMetrics = getAllBatteryMetrics();
		let transformerLoad = getTransformerLoadInfo();
		updateAdditionalTask({
			solarMetrics: solarMetrics,
			batteryMetrics: batteryMetrics,
			transformerLoad: transformerLoad
		});

		if (activeLearningGoal == 1) {
			let progress = "Place one EV charger in " + houseTwoLabel + ".";
			let state = "waiting";
			let goalViewed = hasViewedActiveLearningGoal();

			if ((goalViewed && learningGoalPlacementCount > 0 && houseTwoEvCount > 0) || isCurrentLearningGoalReady()) {
				markCurrentLearningGoalReady("Goal 1 complete: EV added to House 2.");
				progress = houseTwoEvCharging ? "The EV is charging now. Claim the reward." : "EV charger placed. Claim the reward.";
				state = "complete";
			}
			else if (!goalViewed) {
				progress = "Open this goal first, then place one EV charger in " + houseTwoLabel + ".";
			}

			setLearningGoalPanel(
				"Goal 1: Add an EV",
				"Place one EV charger in " + houseTwoLabel + ".",
				progress,
				state,
				null,
				false,
				"An EV charger is a high-power load. It quickly raises house demand, so several chargers running together can create a peak on the local cable."
			);
			return;
		}

		if (activeLearningGoal == 2) {
			let houseSolarCount = getHouseDevicesByType(houseTwo, "pv").length;
			let progress = "Place one solar panel in " + houseTwoLabel + ".";
			let state = "waiting";
			let goalViewed = hasViewedActiveLearningGoal();

			if ((goalViewed && learningGoalPlacementCount > 0 && houseSolarCount > 0) || isCurrentLearningGoalReady()) {
				markCurrentLearningGoalReady("Goal 2 complete: solar added to House 2.");
				progress = solarMetrics.generatingCount > 0 ? "Solar is producing power. Claim the reward." : "Solar installed. Claim the reward.";
				state = "complete";
			}
			else if (!goalViewed) {
				progress = "Open this goal first, then place one solar panel in " + houseTwoLabel + ".";
			}

			setLearningGoalPanel(
				"Goal 2: Add Solar",
				"Place one solar panel in " + houseTwoLabel + ".",
				progress,
				state,
				null,
				false,
				"Solar panels generate local electricity during daylight. This can reduce grid import first, and any extra solar can later be stored in a battery."
			);
			return;
		}

		if (activeLearningGoal == 3) {
			let hasManualDischarge = houseHasBatteryStrategy(houseTwo, "manual_discharge");
			let manualDischarging = isHouseBatteryDischargingWithStrategy(houseTwo, "manual_discharge");
			let progress = "Add one battery to " + houseTwoLabel + ", then press '-'.";
			let state = "waiting";
			let goalViewed = hasViewedActiveLearningGoal();
			let startedStrategyChangeCount = getLearningGoalStartValue("batteryStrategyChangeCount", batteryStrategyChangeCount);

			if ((goalViewed && houseTwoBatteryMetrics.count > 0 && hasManualDischarge && batteryStrategyChangeCount > startedStrategyChangeCount) || isCurrentLearningGoalReady()) {
				markCurrentLearningGoalReady("Goal 3 complete: battery manual discharge selected.");
				progress = manualDischarging ? "The battery is discharging. Claim the reward." : "Manual discharge selected. Claim the reward.";
				state = "complete";
			}
			else if (!goalViewed) {
				progress = "Open this goal first, then add a battery and press '-'.";
			}
			else if (houseTwoBatteryMetrics.count > 0) {
				progress = "Battery installed. Press '-'. Green means charging, red means discharging.";
				state = "active";
			}

			setLearningGoalPanel(
				"Goal 3: Battery Manual Support",
				"Add a battery to " + houseTwoLabel + " and press '-' to show discharge.",
				progress,
				state,
				null,
				false,
				"A battery can support the house by discharging into real demand. Manual discharge is useful for demonstration, but real systems usually use a controller to avoid wasting stored energy."
			);
			return;
		}

		if (activeLearningGoal == 4) {
			let houseOneSolarCount = getHouseDevicesByType(houseOne, "pv").length;
			let houseOnePower = getHousePowerWatts(houseOne, getHouseLoadInfo(houseOne));
			let houseOneExporting = houseOneSolarCount > 0 && houseOnePower < GOAL_SOLAR_EXPORT_THRESHOLD_W;
			let progress = "Add solar to " + houseOneLabel + " until Power W is below -50 W.";
			let state = "waiting";
			let goalViewed = hasViewedActiveLearningGoal();
			let startedHouseOneSolarCount = getLearningGoalStartValue("houseOneSolarCount", houseOneSolarCount);
			let startedHouseOneExporting = getLearningGoalStartValue("houseOneExporting", houseOneExporting);
			let solarChangedAfterViewing = learningGoalPlacementCount > 0 || houseOneSolarCount > startedHouseOneSolarCount || !startedHouseOneExporting;

			if ((goalViewed && houseOneExporting && solarChangedAfterViewing) || isCurrentLearningGoalReady()) {
				markCurrentLearningGoalReady("Goal 4 complete: House 1 exported solar power.");
				progress = houseOneLabel + " is exporting surplus solar (" + formatPowerWatts(houseOnePower) + "). Claim the reward.";
				state = "complete";
			}
			else if (!goalViewed) {
				progress = "Open this goal first, then add solar to " + houseOneLabel + ".";
			}
			else if (houseOneSolarCount > 0) {
				progress = houseOneSolarCount + " PV panel(s) in " + houseOneLabel + ". Add more PV or wait for stronger sun.";
				state = "active";
			}

			setLearningGoalPanel(
				"Goal 4: House 1 Solar Export",
				"Make " + houseOneLabel + " produce more solar than it uses.",
				progress,
				state,
				null,
				false,
				"Negative Power W means the house is exporting surplus solar. In a neighborhood microgrid, extra local generation can support nearby houses before it flows back toward the transformer."
			);
			return;
		}

		if (activeLearningGoal == 5) {
			let goalViewed = hasViewedActiveLearningGoal();
			if (goalViewed && goal5StrategyStartCount === null) {
				goal5StrategyStartCount = batteryStrategyChangeCount;
			}

			let houseTwoSmart = houseHasBatteryStrategy(houseTwo, "smart");
			let smartSelectedAfterGoalStart = goalViewed && houseTwoSmart && batteryStrategyChangeCount > goal5StrategyStartCount;
			let progress = "Switch the " + houseTwoLabel + " battery to Smart.";
			let state = "waiting";

			if (smartSelectedAfterGoalStart || isCurrentLearningGoalReady()) {
				markCurrentLearningGoalReady("Goal 5 complete: Smart battery control selected.");
				progress = "Smart selected. Claim the reward.";
				state = "complete";
			}
			else if (!goalViewed) {
				progress = "Open this goal first, then switch the " + houseTwoLabel + " battery to Smart.";
			}
			else if (houseTwoBatteryMetrics.count > 0) {
				progress = houseTwoSmart ?
					"Smart is already selected. Tap Solar once, then Smart again to confirm the controller." :
					"Tap the middle Solar/Smart button until it shows Smart.";
				state = "active";
			}

			setLearningGoalPanel(
				"Goal 5: Smart Controller Setup",
				"Set the " + houseTwoLabel + " battery to Smart.",
				progress,
				state,
				null,
				false,
				"Smart mode stores surplus solar and discharges when a high-power device is running. This makes the battery act like peak support instead of serving every small base load."
			);
			return;
		}

		if (activeLearningGoal == 6) {
			let houseThreeLoadCount = getLearningGoalLoadCount(houseThree);
			let houseFourLoadCount = getLearningGoalLoadCount(houseFour);
			let progress = "Place a load device in " + houseThreeLabel + " or " + houseFourLabel + ".";
			let state = "waiting";
			let goalViewed = hasViewedActiveLearningGoal();
			let startedHouseThreeLoadCount = getLearningGoalStartValue("houseThreeLoadCount", houseThreeLoadCount);
			let startedHouseFourLoadCount = getLearningGoalStartValue("houseFourLoadCount", houseFourLoadCount);
			let loadAddedAfterViewing = learningGoalPlacementCount > 0 || houseThreeLoadCount > startedHouseThreeLoadCount || houseFourLoadCount > startedHouseFourLoadCount;

			if ((goalViewed && loadAddedAfterViewing) || isCurrentLearningGoalReady()) {
				let targetHouseLabel = learningGoalLastPlacementHouse == houseThree ? houseThreeLabel :
					learningGoalLastPlacementHouse == houseFour ? houseFourLabel :
					houseThreeLoadCount > startedHouseThreeLoadCount ? houseThreeLabel : houseFourLabel;
				markCurrentLearningGoalReady("Goal 6 complete: load was spread to another house.");
				progress = "Load is now spread to " + targetHouseLabel + ". Claim the reward.";
				state = "complete";
			}
			else if (!goalViewed) {
				progress = "Open this goal first, then place a load device in " + houseThreeLabel + " or " + houseFourLabel + ".";
			}

			setLearningGoalPanel(
				"Goal 6: Spread Load",
				"Do not put all load in one house. Place an EV, heat pump, washer, or dishwasher in another house.",
				progress,
				state,
				null,
				false,
				"Spreading devices across houses uses spare cable capacity. It prevents one house from becoming overloaded even when the total neighborhood demand is still manageable."
			);
			return;
		}

		if (activeLearningGoal == 7) {
			let heatPumpCount = getPlacedDeviceCountByType("hp");
			let washingMachineCount = getPlacedDeviceCountByType("wm");
			let dishwasherCount = getPlacedDeviceCountByType("dw");
			let progress = "Add 1 heat pump, 1 washing machine, and 1 dishwasher.";
			let state = "waiting";
			let goalViewed = hasViewedActiveLearningGoal();
			let startedHeatPumpCount = getLearningGoalStartValue("heatPumpCount", heatPumpCount);
			let startedWashingMachineCount = getLearningGoalStartValue("washingMachineCount", washingMachineCount);
			let startedDishwasherCount = getLearningGoalStartValue("dishwasherCount", dishwasherCount);
			let addedAllAfterViewing =
				(learningGoalPlacementTypes.hp || heatPumpCount > startedHeatPumpCount) &&
				(learningGoalPlacementTypes.wm || washingMachineCount > startedWashingMachineCount) &&
				(learningGoalPlacementTypes.dw || dishwasherCount > startedDishwasherCount);

			if ((goalViewed && addedAllAfterViewing) || isCurrentLearningGoalReady()) {
				markCurrentLearningGoalReady("Final goal complete: all main goals finished.");
				progress = "Final goal complete. Claim the reward, then continue as the street manager.";
				state = "complete";
			}
			else if (!goalViewed) {
				progress = "Open this goal first, then add the heat pump, washing machine, and dishwasher.";
			}
			else if (heatPumpCount + washingMachineCount + dishwasherCount > 0) {
				progress = "Installed: heat pump " + heatPumpCount + "/1, washing machine " + washingMachineCount + "/1, dishwasher " + dishwasherCount + "/1.";
				state = "active";
			}

			setLearningGoalPanel(
				"Goal 7: Flexible Load Training",
				"Add a heat pump, washing machine, and dishwasher.",
				progress,
				state,
				null,
				false,
				"Flexible loads can often move to better times. You completed all main goals; continue as the street manager and keep earning bonus rewards."
			);
			return;
		}

		if (activeLearningGoal >= LEARNING_GOAL_COMPLETE_INDEX) {
			setLearningGoalPanel(
				"All goals complete",
				"You completed all main goals. You are the street manager now: keep playing and manage the neighborhood grid.",
				"Bonus tasks can now appear based on the current grid situation.",
				"complete",
				null,
				false,
				""
			);
		}
	}

	function restorePreviousVisualState(device) {
		if (device.getAttribute("data-game-previous-x") !== null) {
			device.setAttribute("data-x", device.getAttribute("data-game-previous-x"));
		}
		if (device.getAttribute("data-game-previous-y") !== null) {
			device.setAttribute("data-y", device.getAttribute("data-game-previous-y"));
		}
		if (device.getAttribute("data-game-previous-s") !== null) {
			device.setAttribute("data-s", device.getAttribute("data-game-previous-s"));
		}
		if (device.getAttribute("data-game-previous-z") !== null) {
			device.setAttribute("data-z", device.getAttribute("data-game-previous-z"));
		}

		let previousTransform = device.getAttribute("data-game-previous-transform");
		if (previousTransform !== null) {
			device.style.webkitTransform = previousTransform;
			device.style.transform = previousTransform;
		}
	}

	function restoreDeviceToPreviousHouse(device) {
		let previousHouse = parseInt(device.getAttribute("data-game-previous-house"), 10);
		let type = getDeviceType(device);

		if (isNaN(previousHouse) || !type) {
			return false;
		}

		device.setAttribute("data-house", previousHouse);
		device.setAttribute("data-oldhouse", previousHouse);
		device.style.opacity = 1;
		device.setAttribute("data-opacity", 100);
		restorePreviousVisualState(device);

		if (typeof addDeviceToDEMKit == "function") {
			let scale = parseFloat(device.getAttribute("data-z")) || 1;
			addDeviceToDEMKit(type, previousHouse, device.id, scale);
		}

		setMessage(DEVICE_LABELS[type] + " stays in House " + (previousHouse + 1) + ".");
		return true;
	}

	function rejectNewDevice(device) {
		device.setAttribute("data-house", "");
		device.setAttribute("data-oldhouse", "");
		device.style.opacity = 0.55;
		device.setAttribute("data-opacity", 55);
	}

	function upgradeHouseSlot(houseNumber) {
		if (budget < GAMEFICATION_CONFIG.slotUpgradeCost) {
			setMessage("Not enough coins for a slot upgrade.");
			return;
		}

		houseSlots[houseNumber] += 1;
		changeBudget(
			"House " + (houseNumber + 1) + " slot upgrade to " + houseSlots[houseNumber],
			-GAMEFICATION_CONFIG.slotUpgradeCost
		);
		setMessage("");
		refreshGameficationUI();
	}

	function createBudgetPanel(board) {
		let panel = document.createElement("div");
		panel.id = "gameficationBudgetPanel";
		panel.className = "gamefication-panel noselect";
		panel.innerHTML =
			"<div class=\"gamefication-budget\">Budget: <span id=\"gameficationBudgetValue\">" + GAMEFICATION_CONFIG.startingBudget + "</span> coins</div>" +
			"<div id=\"gameficationBudgetHistory\" class=\"budget-history\"></div>" +
			"<div id=\"gameficationMessage\" class=\"gamefication-message\"></div>";

		board.appendChild(panel);
		budgetValueElement = document.getElementById("gameficationBudgetValue");
		budgetHistoryElement = document.getElementById("gameficationBudgetHistory");
		messageElement = document.getElementById("gameficationMessage");
		if (budgetHistory.length == 0) {
			addBudgetHistoryEntry("Starting budget", GAMEFICATION_CONFIG.startingBudget, budget);
		}
		else {
			renderBudgetHistory();
		}
	}

	function createEventPanel(board) {
		let panel = document.createElement("div");
		panel.id = "gameficationEventPanel";
		panel.className = "gamefication-event-panel noselect hidden";
		panel.innerHTML =
			"<div id=\"gameficationEventTitle\" class=\"gamefication-event-title\">Event</div>" +
			"<div id=\"gameficationEventText\" class=\"gamefication-event-text\"></div>";

		board.appendChild(panel);
		eventPanelElement = panel;
		eventTitleElement = document.getElementById("gameficationEventTitle");
		eventTextElement = document.getElementById("gameficationEventText");
	}

	function getSimulationDate() {
		if (typeof DEMData == "undefined" || !DEMData || !DEMData.host) {
			return null;
		}

		let currentTime = Number(DEMData.host.currentTime);
		if (!Number.isFinite(currentTime)) {
			return null;
		}

		return new Date(currentTime * 1000);
	}

	function getSeasonName(date) {
		if (!date) {
			return "--";
		}

		let month = date.getMonth();
		if (month >= 2 && month <= 4) {
			return "Spring";
		}
		if (month >= 5 && month <= 7) {
			return "Summer";
		}
		if (month >= 8 && month <= 10) {
			return "Autumn";
		}
		return "Winter";
	}

	function formatSimulationTime(date) {
		if (!date) {
			return "--:--";
		}

		let day = date.toLocaleDateString("en-GB", {
			day: "2-digit",
			month: "short"
		});
		let time = date.toLocaleTimeString("en-GB", {
			hour: "2-digit",
			minute: "2-digit",
			hour12: false
		});

		return day + " " + time;
	}

	function createTimeSeasonPanel(board) {
		let panel = document.createElement("div");
		panel.id = "timeSeasonPanel";
		panel.className = "time-season-panel noselect";
		panel.innerHTML =
			"<div class=\"time-season-title\">Simulation</div>" +
			"<div class=\"time-season-row\"><span>Time</span><b class=\"time-season-time\">--:--</b></div>" +
			"<div class=\"time-season-row\"><span>Season</span><b class=\"time-season-season\">--</b></div>" +
			"<div class=\"time-season-row time-season-transformer-row\"><span>Transformer</span><b class=\"transformer-current-amp\">0 A</b></div>";

		board.appendChild(panel);
		timeSeasonPanelElement = panel;
		timeSeasonTimeElement = panel.querySelector(".time-season-time");
		timeSeasonSeasonElement = panel.querySelector(".time-season-season");
		transformerStatusElement = panel;
	}

	function createTransformerStatusPanel(board) {
		let panel = document.createElement("div");
		panel.id = "transformerStatusPanel";
		panel.className = "transformer-status-panel noselect load-safe";
		panel.innerHTML =
			"<div class=\"transformer-status-title\">Transformer</div>" +
			"<div class=\"transformer-status-main\">" +
			"<span>Current <b class=\"transformer-current-amp\">0 A</b></span>" +
			"</div>";

		board.appendChild(panel);
		transformerStatusElement = panel;
	}

	function createLearningGoalPanel(board) {
		let panel = document.createElement("div");
		panel.id = "gameficationLearningGoalPanel";
		panel.className = "gamefication-panel noselect";
		panel.innerHTML =
			"<button id=\"gameficationLearningGoalButton\" class=\"gamefication-goal-button waiting\" type=\"button\" aria-label=\"Grid Bonus +" + LEARNING_GOAL_REWARD + ", Goal 1\">" +
			"<span class=\"gamefication-coin-icon\" aria-hidden=\"true\">$</span>" +
			"<span class=\"gamefication-goal-button-copy\">" +
			"<span class=\"gamefication-goal-button-label\">Grid Bonus</span>" +
			"<span class=\"gamefication-goal-button-bottom\">" +
			"<span class=\"gamefication-goal-button-reward\">+" + LEARNING_GOAL_REWARD + "</span>" +
			"<span class=\"gamefication-goal-button-status\">Goal 1</span>" +
			"</span>" +
			"</span>" +
			"</button>" +
			"<div id=\"gameficationLearningGoalOverlay\" class=\"gamefication-goal-overlay hidden\">" +
			"<div id=\"gameficationLearningGoal\" class=\"gamefication-learning-goal waiting\">" +
			"<div class=\"gamefication-learning-kicker\">Reward Opportunity</div>" +
			"<div class=\"gamefication-learning-header\">" +
			"<div id=\"gameficationLearningGoalTitle\" class=\"gamefication-learning-title\">Goal 1: Add an EV</div>" +
			"<div id=\"gameficationLearningGoalReward\" class=\"gamefication-goal-reward\">+" + LEARNING_GOAL_REWARD + " coins</div>" +
			"</div>" +
			"<div id=\"gameficationLearningGoalText\" class=\"gamefication-learning-text\">Place one EV charger in House 2.</div>" +
			"<div id=\"gameficationLearningGoalProgress\" class=\"gamefication-learning-progress\">Waiting for one EV charger.</div>" +
			"<div class=\"gamefication-learning-section\">" +
			"<div class=\"gamefication-learning-section-title\">Learning</div>" +
			"<div id=\"gameficationLearningGoalLearning\" class=\"gamefication-learning-lesson\">An EV uses a lot of power.</div>" +
			"</div>" +
			"<div id=\"gameficationAdditionalTask\" class=\"gamefication-additional-task hidden\">" +
			"<div class=\"gamefication-additional-head\">" +
			"<span>Additional Bonus</span>" +
			"<b id=\"gameficationAdditionalReward\">+" + ADDITIONAL_TASK_REWARD + "</b>" +
			"</div>" +
			"<div id=\"gameficationAdditionalText\" class=\"gamefication-additional-text\"></div>" +
			"<button id=\"gameficationAdditionalAction\" class=\"gamefication-additional-action\" type=\"button\">Claim +" + ADDITIONAL_TASK_REWARD + "</button>" +
			"</div>" +
			"<button id=\"gameficationLearningGoalAction\" class=\"gamefication-learning-action\" type=\"button\">Claim +" + LEARNING_GOAL_REWARD + "</button>" +
			"</div>" +
			"</div>";

		board.appendChild(panel);
		learningGoalButtonElement = document.getElementById("gameficationLearningGoalButton");
		learningGoalOverlayElement = document.getElementById("gameficationLearningGoalOverlay");
		learningGoalTitleElement = document.getElementById("gameficationLearningGoalTitle");
		learningGoalTextElement = document.getElementById("gameficationLearningGoalText");
		learningGoalProgressElement = document.getElementById("gameficationLearningGoalProgress");
		learningGoalLearningElement = document.getElementById("gameficationLearningGoalLearning");
		learningGoalAdditionalElement = document.getElementById("gameficationAdditionalTask");
		learningGoalAdditionalTextElement = document.getElementById("gameficationAdditionalText");
		learningGoalAdditionalRewardElement = document.getElementById("gameficationAdditionalReward");
		learningGoalAdditionalActionElement = document.getElementById("gameficationAdditionalAction");
		learningGoalRewardElement = document.getElementById("gameficationLearningGoalReward");
		learningGoalActionElement = document.getElementById("gameficationLearningGoalAction");
		if (learningGoalButtonElement && learningGoalOverlayElement) {
			learningGoalButtonElement.addEventListener("pointerdown", event => event.stopPropagation());
			learningGoalButtonElement.addEventListener("click", function (event) {
				event.preventDefault();
				event.stopPropagation();
				if (claimCurrentLearningGoal()) {
					return;
				}
				noteActiveLearningGoalViewed();
				learningGoalOverlayElement.classList.remove("hidden");
				refreshGameficationUI();
			});
			learningGoalOverlayElement.addEventListener("pointerdown", event => event.stopPropagation());
			learningGoalOverlayElement.addEventListener("click", function (event) {
				if (event.target == learningGoalOverlayElement) {
					learningGoalOverlayElement.classList.add("hidden");
				}
			});
			let goalCard = document.getElementById("gameficationLearningGoal");
			if (goalCard) {
				goalCard.addEventListener("click", event => event.stopPropagation());
				goalCard.addEventListener("pointerdown", event => event.stopPropagation());
			}
		}
		if (learningGoalActionElement) {
			learningGoalActionElement.addEventListener("pointerdown", event => event.stopPropagation());
			learningGoalActionElement.addEventListener("click", function (event) {
				event.preventDefault();
				event.stopPropagation();
				claimCurrentLearningGoal();
				refreshGameficationUI();
			});
		}
		if (learningGoalAdditionalActionElement) {
			learningGoalAdditionalActionElement.addEventListener("pointerdown", event => event.stopPropagation());
			learningGoalAdditionalActionElement.addEventListener("click", function (event) {
				event.preventDefault();
				event.stopPropagation();
				claimAdditionalTask();
			});
		}
	}

	function createDevicePriceTags(board) {
		Object.keys(DEVICE_PRICE_TAGS).forEach(type => {
			let tag = document.createElement("div");
			let position = DEVICE_PRICE_TAGS[type];

			tag.id = "devicePriceTag-" + type;
			tag.className = "device-price-tag noselect";
			tag.style.left = position.left + "px";
			tag.style.top = position.top + "px";
			tag.textContent = GAMEFICATION_CONFIG.prices[type] + " coins";
			board.appendChild(tag);
		});
	}

	function createDevicePowerTags(board) {
		Object.keys(DEVICE_POWER_TAGS).forEach(type => {
			let tag = document.createElement("div");
			let position = DEVICE_POWER_TAGS[type];

			tag.id = "devicePowerTag-" + type;
			tag.className = "device-power-tag noselect";
			tag.style.left = position.left + "px";
			tag.style.top = position.top + "px";
			tag.textContent = DEVICE_MAX_POWER_LABELS[type];
			board.appendChild(tag);
		});
	}

	function createHouseSlotControls(board) {
		for (let houseNumber = 0; houseNumber < houseCount(); houseNumber++) {
			let house = document.getElementById("house" + houseNumber);
			if (!house) {
				continue;
			}

			let control = document.createElement("div");
			let houseLeft = parseInt(house.style.left, 10) || 0;
			let houseTop = parseInt(house.style.top, 10) || 0;

			control.id = "houseSlotControl" + houseNumber;
			control.className = "house-slot-control noselect";
			control.style.left = (houseLeft + 12) + "px";
			control.style.top = (houseTop + 12) + "px";
			control.innerHTML =
				"<div class=\"house-status-main\">" +
				"<span class=\"house-status-name\">House " + (houseNumber + 1) + ":</span>" +
				"<span>Load <b class=\"house-load-percent\">0%</b></span>" +
				"<span>Power <b class=\"house-power-watt\">0 W</b></span>" +
				"</div>" +
				"<div class=\"house-status-row\">" +
				"<span class=\"slot-count\">Slots <b class=\"slot-used\">0</b>/<b class=\"slot-max\">3</b></span>" +
				"<button type=\"button\" data-slot-upgrade=\"" + houseNumber + "\">+ Slot -10</button>" +
				"</div>" +
				"<div class=\"house-load-tip\">Tip: this house has spare capacity.</div>";

			control.addEventListener("pointerdown", event => event.stopPropagation());
			control.querySelector("button").addEventListener("click", event => {
				event.preventDefault();
				event.stopPropagation();
				upgradeHouseSlot(houseNumber);
			});

			board.appendChild(control);
		}
	}

	function createMissionOverlay(board) {
		let overlay = document.createElement("div");
		overlay.id = "gameficationMissionOverlay";
		overlay.className = "gamefication-mission-overlay noselect";

		let taskItems = MAIN_MISSION.tasks.map(task => "<li>" + task + "</li>").join("");
		let watchItems = MAIN_MISSION.watch.map(item => "<span>" + item + "</span>").join("");

		overlay.innerHTML =
			"<div class=\"gamefication-mission-card\">" +
			"<div class=\"gamefication-mission-header\">" +
			"<img src=\"images/saxion-logo.png\" alt=\"Saxion\" class=\"gamefication-mission-logo\">" +
			"<div>" +
			"<div class=\"gamefication-mission-kicker\">Main Goal</div>" +
			"<h1>" + MAIN_MISSION.title + "</h1>" +
			"</div>" +
			"</div>" +
			"<p class=\"gamefication-mission-goal\">" + MAIN_MISSION.goal + "</p>" +
			"<div class=\"gamefication-mission-section\">" +
			"<h2>Big Tasks</h2>" +
			"<ol>" + taskItems + "</ol>" +
			"</div>" +
			"<div class=\"gamefication-mission-section\">" +
			"<h2>Watch During Play</h2>" +
			"<div class=\"gamefication-mission-watch\">" + watchItems + "</div>" +
			"</div>" +
			"<button type=\"button\" id=\"gameficationStartMission\">Start Mission</button>" +
			"</div>";

		overlay.addEventListener("pointerdown", event => event.stopPropagation());
		board.appendChild(overlay);
		missionOverlayElement = overlay;

		document.getElementById("gameficationStartMission").addEventListener("click", event => {
			event.preventDefault();
			event.stopPropagation();
			missionOverlayElement.classList.add("hidden");
			if (typeof ensureSimulationPlaying == "function") {
				ensureSimulationPlaying();
			}
			setMessage("Mission started:");
		});
	}

	function injectGameficationStyles() {
		let style = document.createElement("style");
		style.textContent = [
			"#gameficationMissionOverlay {",
			"	position: absolute;",
			"	z-index: 2200;",
			"	left: 0;",
			"	top: 0;",
			"	width: 1920px;",
			"	height: 1080px;",
			"	display: flex;",
			"	align-items: center;",
			"	justify-content: center;",
			"	background: rgba(0, 0, 0, 0.52);",
			"	font-family: Arial, sans-serif;",
			"	pointer-events: auto;",
			"}",
			"#gameficationMissionOverlay.hidden {",
			"	display: none;",
			"}",
			".gamefication-mission-card {",
			"	width: 760px;",
			"	padding: 24px 28px;",
			"	border: 2px solid #d8f7cf;",
			"	border-radius: 6px;",
			"	background: rgba(16, 20, 16, 0.94);",
			"	color: #f4f7ef;",
			"	box-shadow: 0 12px 34px rgba(0, 0, 0, 0.48);",
			"}",
			".gamefication-mission-header {",
			"	display: flex;",
			"	align-items: flex-start;",
			"	gap: 16px;",
			"	margin-bottom: 10px;",
			"}",
			".gamefication-mission-logo {",
			"	width: 76px;",
			"	height: 76px;",
			"	object-fit: contain;",
			"	flex: 0 0 auto;",
			"	border: 1px solid rgba(255, 255, 255, 0.24);",
			"	border-radius: 4px;",
			"	background: #009b82;",
			"}",
			".gamefication-mission-kicker {",
			"	display: inline-block;",
			"	margin-bottom: 8px;",
			"	padding: 4px 8px;",
			"	border: 1px solid rgba(132, 255, 104, 0.65);",
			"	border-radius: 3px;",
			"	color: #84ff68;",
			"	font-size: 14px;",
			"	font-weight: 800;",
			"	text-transform: uppercase;",
			"}",
			".gamefication-mission-card h1 {",
			"	margin: 0 0 10px 0;",
			"	color: #ffffff;",
			"	font-size: 34px;",
			"	line-height: 1.05;",
			"}",
			".gamefication-mission-goal {",
			"	margin: 0 0 18px 0;",
			"	color: #d7f1ff;",
			"	font-size: 20px;",
			"	font-weight: 700;",
			"	line-height: 1.28;",
			"}",
			".gamefication-mission-section {",
			"	margin-top: 14px;",
			"}",
			".gamefication-mission-section h2 {",
			"	margin: 0 0 6px 0;",
			"	color: #ffd55e;",
			"	font-size: 18px;",
			"	line-height: 1.2;",
			"}",
			".gamefication-mission-section ol {",
			"	margin: 0;",
			"	padding-left: 22px;",
			"	color: #ffffff;",
			"	font-size: 17px;",
			"	font-weight: 700;",
			"	line-height: 1.35;",
			"}",
			".gamefication-mission-watch {",
			"	display: flex;",
			"	flex-wrap: wrap;",
			"	gap: 6px;",
			"}",
			".gamefication-mission-watch span {",
			"	padding: 4px 7px;",
			"	border: 1px solid rgba(215, 241, 255, 0.5);",
			"	border-radius: 3px;",
			"	background: rgba(215, 241, 255, 0.12);",
			"	color: #d7f1ff;",
			"	font-size: 14px;",
			"	font-weight: 800;",
			"}",
			"#gameficationStartMission {",
			"	display: block;",
			"	margin-top: 20px;",
			"	width: 100%;",
			"	height: 44px;",
			"	border: 2px solid #111;",
			"	border-radius: 4px;",
			"	background: #84ff68;",
			"	color: #102010;",
			"	font-size: 18px;",
			"	font-weight: 900;",
			"	cursor: pointer;",
			"	touch-action: manipulation;",
			"}",
			"#gameficationBudgetPanel {",
			"	position: absolute;",
			"	z-index: 1400;",
			"	left: 310px;",
			"	top: 365px;",
			"	width: 370px;",
			"	padding: 8px 10px;",
			"	border: 2px solid #d9d9d9;",
			"	border-radius: 4px;",
			"	background: rgba(18, 18, 18, 0.88);",
			"	color: #fff;",
			"	font-family: Arial, sans-serif;",
			"	pointer-events: none;",
			"	box-shadow: 0 3px 8px rgba(0, 0, 0, 0.35);",
			"}",
			"@keyframes gameficationGoalPulse {",
			"	0%, 100% { transform: translateY(0); box-shadow: 0 4px 12px rgba(255, 213, 94, 0.28); }",
			"	50% { transform: translateY(-1px); box-shadow: 0 7px 18px rgba(255, 213, 94, 0.58); }",
			"}",
			"@keyframes gameficationGoalReady {",
			"	0%, 100% { transform: scale(1); box-shadow: 0 4px 14px rgba(132, 255, 104, 0.32); }",
			"	50% { transform: scale(1.035); box-shadow: 0 7px 22px rgba(132, 255, 104, 0.72); }",
			"}",
			"@keyframes gameficationRewardBurst {",
			"	0% { opacity: 0; transform: translate(-50%, 0) scale(0.82); }",
			"	18% { opacity: 1; transform: translate(-50%, -12px) scale(1.04); }",
			"	100% { opacity: 0; transform: translate(-50%, -72px) scale(1); }",
			"}",
			"#gameficationLearningGoalPanel {",
			"	position: absolute;",
			"	z-index: 1450;",
			"	left: 418px;",
			"	top: 244px;",
			"	width: 178px;",
			"	padding: 0;",
			"	font-family: Arial, sans-serif;",
			"	pointer-events: auto;",
			"}",
			".gamefication-goal-button {",
			"	position: relative;",
			"	display: flex;",
			"	align-items: center;",
			"	gap: 8px;",
			"	width: 176px;",
			"	min-height: 54px;",
			"	padding: 7px 9px;",
			"	border: 2px solid #ffd55e;",
			"	border-radius: 8px;",
			"	background: rgba(28, 24, 12, 0.92);",
			"	color: #ffd55e;",
			"	font-size: 12px;",
			"	font-weight: 900;",
			"	text-align: left;",
			"	cursor: pointer;",
			"	box-shadow: 0 4px 12px rgba(255, 213, 94, 0.28);",
			"	touch-action: manipulation;",
			"	animation: gameficationGoalPulse 1.7s ease-in-out infinite;",
			"}",
			".gamefication-goal-button::after {",
			"	content: '';",
			"	position: absolute;",
			"	right: 6px;",
			"	top: 6px;",
			"	width: 7px;",
			"	height: 7px;",
			"	border-radius: 50%;",
			"	background: #ffd55e;",
			"	box-shadow: 0 0 8px rgba(255, 213, 94, 0.95);",
			"}",
			".gamefication-coin-icon {",
			"	display: flex;",
			"	align-items: center;",
			"	justify-content: center;",
			"	width: 34px;",
			"	height: 34px;",
			"	flex: 0 0 34px;",
			"	border: 2px solid #fff0a4;",
			"	border-radius: 50%;",
			"	background: radial-gradient(circle at 34% 30%, #fff6b7 0%, #ffd55e 38%, #ce8509 100%);",
			"	color: #2c1a00;",
			"	font-size: 20px;",
			"	font-weight: 900;",
			"	line-height: 1;",
			"	box-shadow: inset 0 -2px 4px rgba(92, 48, 0, 0.34), 0 0 12px rgba(255, 213, 94, 0.52);",
			"}",
			".gamefication-goal-button-copy {",
			"	display: flex;",
			"	flex-direction: column;",
			"	gap: 3px;",
			"	min-width: 0;",
			"}",
			".gamefication-goal-button-label {",
			"	color: #fff5bb;",
			"	font-size: 13px;",
			"	line-height: 1;",
			"	white-space: nowrap;",
			"}",
			".gamefication-goal-button-bottom {",
			"	display: flex;",
			"	align-items: center;",
			"	gap: 6px;",
			"	line-height: 1;",
			"}",
			".gamefication-goal-button-reward {",
			"	color: #84ff68;",
			"	font-size: 15px;",
			"	font-weight: 900;",
			"}",
			".gamefication-goal-button-status {",
			"	padding: 2px 4px;",
			"	border: 1px solid rgba(255, 255, 255, 0.24);",
			"	border-radius: 3px;",
			"	color: #d7f1ff;",
			"	font-size: 10px;",
			"	font-weight: 900;",
			"	background: rgba(255, 255, 255, 0.08);",
			"}",
			".gamefication-goal-button.active {",
			"	border-color: #ffd55e;",
			"	background: rgba(74, 55, 8, 0.88);",
			"}",
			".gamefication-goal-button.complete {",
			"	border-color: #84ff68;",
			"	color: #84ff68;",
			"	background: rgba(22, 75, 18, 0.88);",
			"	animation: gameficationGoalReady 0.95s ease-in-out infinite;",
			"}",
			".gamefication-goal-button.complete::after {",
			"	background: #84ff68;",
			"	box-shadow: 0 0 10px rgba(132, 255, 104, 0.95);",
			"}",
			".gamefication-goal-button.complete .gamefication-goal-button-label,",
			".gamefication-goal-button.complete .gamefication-goal-button-reward {",
			"	color: #84ff68;",
			"}",
			".gamefication-goal-overlay {",
			"	position: fixed;",
			"	z-index: 2400;",
			"	left: 0;",
			"	top: 0;",
			"	width: 100vw;",
			"	height: 100vh;",
			"	display: flex;",
			"	align-items: center;",
			"	justify-content: center;",
			"	background: rgba(0, 0, 0, 0.22);",
			"	pointer-events: auto;",
			"}",
			".gamefication-goal-overlay.hidden {",
			"	display: none;",
			"}",
			".gamefication-budget {",
			"	font-size: 20px;",
			"	font-weight: 700;",
			"	color: #84ff68;",
			"	line-height: 1.1;",
			"}",
			".budget-history {",
			"	margin-top: 3px;",
			"}",
			".budget-history-row {",
			"	display: grid;",
			"	grid-template-columns: minmax(0, 1fr) 42px 46px;",
			"	column-gap: 7px;",
			"	padding: 2px 0;",
			"	border-top: 1px solid rgba(255, 255, 255, 0.12);",
			"	font-size: 11px;",
			"	line-height: 1.15;",
			"}",
			".budget-history-label {",
			"	color: #ffffff;",
			"	overflow-wrap: anywhere;",
			"}",
			".budget-history-change, .budget-history-balance {",
			"	text-align: right;",
			"	font-weight: 900;",
			"}",
			".budget-history-change.income {",
			"	color: #84ff68;",
			"}",
			".budget-history-change.expense {",
			"	color: #ff8b7d;",
			"}",
			".budget-history-change.neutral {",
			"	color: #b9b9b9;",
			"}",
			".budget-history-balance {",
			"	color: #ffd55e;",
			"}",
			".gamefication-message {",
			"	display: none;",
			"	margin-top: 5px;",
			"	max-width: 350px;",
			"	color: #ffd55e;",
			"	font-size: 14px;",
			"	font-weight: 700;",
			"	line-height: 1.2;",
			"}",
			".gamefication-message.visible {",
			"	display: block;",
			"}",
			"#gameficationEventPanel {",
			"	position: absolute;",
			"	z-index: 1330;",
			"	left: 760px;",
			"	top: 365px;",
			"	width: 560px;",
			"	padding: 7px 9px;",
			"	border: 2px solid #ffd55e;",
			"	border-radius: 4px;",
			"	background: rgba(42, 34, 8, 0.9);",
			"	color: #fff;",
			"	font-family: Arial, sans-serif;",
			"	pointer-events: none;",
			"	box-shadow: 0 3px 8px rgba(0, 0, 0, 0.38);",
			"}",
			"#gameficationEventPanel.hidden {",
			"	display: none;",
			"}",
			"#gameficationEventPanel.warning {",
			"	border-color: #ffd55e;",
			"	background: rgba(42, 34, 8, 0.9);",
			"}",
			"#gameficationEventPanel.penalty {",
			"	border-color: #ff5d4f;",
			"	background: rgba(72, 18, 12, 0.93);",
			"}",
			".gamefication-event-title {",
			"	margin-bottom: 4px;",
			"	color: #ffd55e;",
			"	font-size: 15px;",
			"	font-weight: 900;",
			"}",
			"#gameficationEventPanel.penalty .gamefication-event-title {",
			"	color: #ffb4a8;",
			"}",
			".gamefication-event-text {",
			"	color: #fff6c8;",
			"	font-size: 13px;",
			"	font-weight: 800;",
			"	line-height: 1.22;",
			"}",
			"#timeSeasonPanel {",
			"	position: absolute;",
			"	z-index: 1326;",
			"	left: 14px;",
			"	top: 315px;",
			"	width: 180px;",
			"	padding: 7px 8px;",
			"	border: 2px solid #d7f1ff;",
			"	border-radius: 4px;",
			"	background: rgba(16, 24, 28, 0.88);",
			"	color: #ffffff;",
			"	font-family: Arial, sans-serif;",
			"	font-size: 13px;",
			"	line-height: 1.2;",
			"	pointer-events: none;",
			"	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.38);",
			"}",
			"#timeSeasonPanel.load-caution {",
			"	border-color: #ffe35b;",
			"	background: rgba(62, 53, 14, 0.9);",
			"}",
			"#timeSeasonPanel.load-warning {",
			"	border-color: #ff7a45;",
			"	background: rgba(74, 32, 11, 0.92);",
			"}",
			"#timeSeasonPanel.load-overloaded {",
			"	border-color: #ff4b4b;",
			"	background: rgba(80, 12, 12, 0.94);",
			"}",
			".time-season-title {",
			"	margin-bottom: 5px;",
			"	color: #d7f1ff;",
			"	font-size: 13px;",
			"	font-weight: 900;",
			"}",
			".time-season-row {",
			"	display: flex;",
			"	justify-content: space-between;",
			"	gap: 8px;",
			"	margin-top: 3px;",
			"	font-weight: 800;",
			"}",
			".time-season-row b {",
			"	color: #84ff68;",
			"	white-space: nowrap;",
			"}",
			".time-season-transformer-row {",
			"	margin-top: 5px;",
			"	padding-top: 4px;",
			"	border-top: 1px solid rgba(215, 241, 255, 0.22);",
			"}",
			"#transformerStatusPanel {",
			"	position: absolute;",
			"	z-index: 1325;",
			"	left: 95px;",
			"	top: 565px;",
			"	min-width: 135px;",
			"	padding: 6px 8px;",
			"	border: 2px solid #d9d9d9;",
			"	border-radius: 4px;",
			"	background: rgba(24, 24, 24, 0.88);",
			"	color: #fff;",
			"	font-family: Arial, sans-serif;",
			"	font-size: 13px;",
			"	line-height: 1.15;",
			"	pointer-events: none;",
			"	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.38);",
			"}",
			".transformer-status-panel.load-safe {",
			"	border-color: #8cff78;",
			"}",
			".transformer-status-panel.load-caution {",
			"	border-color: #ffe35b;",
			"	background: rgba(62, 53, 14, 0.9);",
			"}",
			".transformer-status-panel.load-warning {",
			"	border-color: #ff7a45;",
			"	background: rgba(74, 32, 11, 0.92);",
			"}",
			".transformer-status-panel.load-overloaded {",
			"	border-color: #ff4b4b;",
			"	background: rgba(80, 12, 12, 0.94);",
			"}",
			".transformer-status-title {",
			"	margin-bottom: 3px;",
			"	color: #d7f1ff;",
			"	font-size: 13px;",
			"	font-weight: 900;",
			"}",
			".transformer-status-main {",
			"	display: flex;",
			"	gap: 8px;",
			"	white-space: nowrap;",
			"	font-weight: 800;",
			"}",
			".transformer-current-amp {",
			"	color: #d7f1ff;",
			"}",
			".gamefication-reward-burst {",
			"	position: fixed;",
			"	z-index: 2600;",
			"	padding: 6px 10px;",
			"	border: 2px solid #84ff68;",
			"	border-radius: 6px;",
			"	background: rgba(12, 38, 14, 0.94);",
			"	color: #84ff68;",
			"	font-family: Arial, sans-serif;",
			"	font-size: 15px;",
			"	font-weight: 900;",
			"	pointer-events: none;",
			"	animation: gameficationRewardBurst 1.35s ease-out forwards;",
			"	box-shadow: 0 5px 18px rgba(132, 255, 104, 0.42);",
			"}",
			".gamefication-learning-goal {",
			"	margin-top: 0;",
			"	width: 520px;",
			"	padding: 16px 18px;",
			"	border: 2px solid rgba(255, 213, 94, 0.78);",
			"	border-radius: 7px;",
			"	background: rgba(12, 14, 18, 0.88);",
			"	color: #ffffff;",
			"	box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45);",
			"	pointer-events: auto;",
			"}",
			".gamefication-learning-goal.active {",
			"	border-color: #ffd55e;",
			"	background: rgba(42, 34, 8, 0.84);",
			"}",
			".gamefication-learning-goal.complete {",
			"	border-color: #84ff68;",
			"	background: rgba(14, 52, 18, 0.84);",
			"}",
			".gamefication-learning-goal.main-complete .gamefication-learning-kicker,",
			".gamefication-learning-goal.main-complete .gamefication-learning-header,",
			".gamefication-learning-goal.main-complete .gamefication-learning-text,",
			".gamefication-learning-goal.main-complete .gamefication-learning-progress,",
			".gamefication-learning-goal.main-complete .gamefication-learning-section,",
			".gamefication-learning-goal.main-complete .gamefication-learning-action {",
			"	display: none !important;",
			"}",
			".gamefication-main-goal-hidden {",
			"	display: none !important;",
			"}",
			".gamefication-learning-goal.main-complete .gamefication-additional-task {",
			"	margin-top: 0;",
			"}",
			".gamefication-learning-kicker {",
			"	display: inline-block;",
			"	margin-bottom: 8px;",
			"	padding: 3px 6px;",
			"	border: 1px solid rgba(255, 213, 94, 0.72);",
			"	border-radius: 3px;",
			"	color: #ffd55e;",
			"	background: rgba(255, 213, 94, 0.12);",
			"	font-size: 12px;",
			"	font-weight: 900;",
			"	letter-spacing: 0;",
			"	text-transform: uppercase;",
			"}",
			".gamefication-learning-header {",
			"	display: flex;",
			"	align-items: flex-start;",
			"	justify-content: space-between;",
			"	gap: 14px;",
			"}",
			".gamefication-goal-reward {",
			"	flex: 0 0 auto;",
			"	padding: 6px 8px;",
			"	border: 1px solid rgba(132, 255, 104, 0.72);",
			"	border-radius: 5px;",
			"	background: rgba(132, 255, 104, 0.12);",
			"	color: #84ff68;",
			"	font-size: 14px;",
			"	font-weight: 900;",
			"	white-space: nowrap;",
			"}",
			".gamefication-learning-title {",
			"	color: #ffd55e;",
			"	font-size: 20px;",
			"	font-weight: 900;",
			"	line-height: 1.15;",
			"}",
			".gamefication-learning-goal.complete .gamefication-learning-title {",
			"	color: #84ff68;",
			"}",
			".gamefication-learning-text {",
			"	margin-top: 8px;",
			"	font-size: 16px;",
			"	font-weight: 800;",
			"	line-height: 1.3;",
			"}",
			".gamefication-learning-progress {",
			"	margin-top: 10px;",
			"	color: #d7f1ff;",
			"	font-size: 14px;",
			"	font-weight: 800;",
			"	line-height: 1.25;",
			"}",
			".gamefication-learning-section {",
			"	margin-top: 12px;",
			"	padding: 9px 10px;",
			"	border: 1px solid rgba(215, 241, 255, 0.28);",
			"	border-radius: 5px;",
			"	background: rgba(215, 241, 255, 0.07);",
			"}",
			".gamefication-learning-section-title {",
			"	margin-bottom: 4px;",
			"	color: #d7f1ff;",
			"	font-size: 12px;",
			"	font-weight: 900;",
			"	text-transform: uppercase;",
			"}",
			".gamefication-learning-lesson {",
			"	color: #ffffff;",
			"	font-size: 13px;",
			"	font-weight: 800;",
			"	line-height: 1.25;",
			"}",
			".gamefication-additional-task {",
			"	margin-top: 10px;",
			"	padding: 9px 10px;",
			"	border: 1px solid rgba(255, 213, 94, 0.58);",
			"	border-radius: 5px;",
			"	background: rgba(255, 213, 94, 0.1);",
			"}",
			".gamefication-additional-task.hidden {",
			"	display: none;",
			"}",
			".gamefication-additional-task.complete {",
			"	border-color: rgba(132, 255, 104, 0.78);",
			"	background: rgba(132, 255, 104, 0.12);",
			"}",
			".gamefication-additional-head {",
			"	display: flex;",
			"	align-items: center;",
			"	justify-content: space-between;",
			"	gap: 10px;",
			"	color: #ffd55e;",
			"	font-size: 13px;",
			"	font-weight: 900;",
			"}",
			".gamefication-additional-task.complete .gamefication-additional-head {",
			"	color: #84ff68;",
			"}",
			".gamefication-additional-head b {",
			"	color: #84ff68;",
			"}",
			".gamefication-additional-text {",
			"	margin-top: 5px;",
			"	color: #fff6c8;",
			"	font-size: 13px;",
			"	font-weight: 800;",
			"	line-height: 1.22;",
			"}",
			".gamefication-additional-action {",
			"	display: none;",
			"	margin-top: 8px;",
			"	padding: 6px 10px;",
			"	border: 1px solid #84ff68;",
			"	border-radius: 5px;",
			"	background: rgba(132, 255, 104, 0.18);",
			"	color: #ffffff;",
			"	font-size: 13px;",
			"	font-weight: 900;",
			"	cursor: pointer;",
			"	pointer-events: auto;",
			"}",
			".gamefication-additional-action.visible {",
			"	display: inline-block;",
			"}",
			".gamefication-additional-action:disabled {",
			"	opacity: 0.5;",
			"	cursor: default;",
			"}",
			".gamefication-learning-action {",
			"	display: none;",
			"	margin-top: 12px;",
			"	padding: 8px 14px;",
			"	border: 1px solid #84ff68;",
			"	border-radius: 5px;",
			"	background: rgba(132, 255, 104, 0.18);",
			"	color: #ffffff;",
			"	font-size: 14px;",
			"	font-weight: 900;",
			"	cursor: pointer;",
			"	pointer-events: auto;",
			"	touch-action: manipulation;",
			"}",
			".gamefication-learning-action.visible {",
			"	display: inline-block;",
			"}",
			".gamefication-learning-action:disabled {",
			"	opacity: 0.5;",
			"	cursor: default;",
			"}",
			".device-price-tag {",
			"	position: absolute;",
			"	z-index: 1350;",
			"	min-width: 70px;",
			"	padding: 3px 6px;",
			"	border: 1px solid #111;",
			"	border-radius: 3px;",
			"	background: rgba(255, 247, 176, 0.96);",
			"	color: #1a1a1a;",
			"	font-family: Arial, sans-serif;",
			"	font-size: 13px;",
			"	font-weight: 700;",
			"	line-height: 1;",
			"	text-align: center;",
			"	pointer-events: none;",
			"	box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);",
			"}",
			".device-power-tag {",
			"	position: absolute;",
			"	z-index: 1350;",
			"	min-width: 80px;",
			"	padding: 3px 6px;",
			"	border: 1px solid #11324a;",
			"	border-radius: 3px;",
			"	background: rgba(224, 244, 255, 0.96);",
			"	color: #122435;",
			"	font-family: Arial, sans-serif;",
			"	font-size: 13px;",
			"	font-weight: 700;",
			"	line-height: 1;",
			"	text-align: center;",
			"	pointer-events: none;",
			"	box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);",
			"}",
			".house-slot-control {",
			"	position: absolute;",
			"	z-index: 1300;",
			"	display: flex;",
			"	flex-direction: column;",
			"	align-items: flex-start;",
			"	gap: 4px;",
			"	min-width: 210px;",
			"	max-width: 260px;",
			"	padding: 6px 7px;",
			"	border: 2px solid #d9d9d9;",
			"	border-radius: 4px;",
			"	background: rgba(24, 24, 24, 0.88);",
			"	color: #fff;",
			"	font-family: Arial, sans-serif;",
			"	font-size: 14px;",
			"	line-height: 1.15;",
			"	box-shadow: 0 2px 6px rgba(0, 0, 0, 0.38);",
			"}",
			".house-slot-control.load-safe {",
			"	border-color: #8cff78;",
			"}",
			".house-slot-control.load-caution {",
			"	border-color: #ffe35b;",
			"	background: rgba(62, 53, 14, 0.9);",
			"}",
			".house-slot-control.load-warning {",
			"	border-color: #ff7a45;",
			"	background: rgba(74, 32, 11, 0.92);",
			"}",
			".house-slot-control.load-overloaded {",
			"	border-color: #ff4b4b;",
			"	background: rgba(80, 12, 12, 0.94);",
			"}",
			".house-slot-control.full {",
			"	border-color: #ff6a4b;",
			"}",
			".house-status-main,",
			".house-status-row {",
			"	display: flex;",
			"	align-items: center;",
			"	gap: 8px;",
			"	white-space: nowrap;",
			"}",
			".house-status-main {",
			"	font-weight: 700;",
			"}",
			".house-load-percent {",
			"	color: #84ff68;",
			"}",
			".house-status-name {",
			"	color: #ffffff;",
			"}",
			".house-power-watt {",
			"	color: #d7f1ff;",
			"}",
			".house-slot-control.load-caution .house-load-percent,",
			".house-slot-control.load-warning .house-load-percent {",
			"	color: #ffe35b;",
			"}",
			".house-slot-control.load-overloaded .house-load-percent {",
			"	color: #ffb4b4;",
			"}",
			".house-load-tip {",
			"	max-width: 245px;",
			"	padding: 4px 5px;",
			"	border: 1px solid rgba(255, 213, 94, 0.45);",
			"	border-radius: 3px;",
			"	background: rgba(0, 0, 0, 0.22);",
			"	color: #ffd55e;",
			"	font-size: 12px;",
			"	font-weight: 700;",
			"	line-height: 1.2;",
			"}",
			".house-slot-control.load-warning .house-load-tip,",
			".house-slot-control.load-overloaded .house-load-tip {",
			"	border-color: #ff7a45;",
			"	background: rgba(80, 20, 10, 0.72);",
			"	color: #fff1c2;",
			"}",
			".house-slot-control button {",
			"	height: 24px;",
			"	padding: 0 7px;",
			"	border: 1px solid #111;",
			"	border-radius: 3px;",
			"	background: #efefef;",
			"	color: #111;",
			"	font-size: 12px;",
			"	font-weight: 700;",
			"	cursor: pointer;",
			"	touch-action: manipulation;",
			"}",
			".house-slot-control button:disabled {",
			"	opacity: 0.45;",
			"}",
			".slot-count {",
			"	white-space: nowrap;",
			"}",
			".battery-strategy-controls {",
			"	position: absolute;",
			"	z-index: 6;",
			"	left: 50%;",
			"	bottom: -22px;",
			"	display: flex;",
			"	align-items: center;",
			"	gap: 3px;",
			"	transform: translateX(-50%);",
			"	pointer-events: auto;",
			"}",
			".battery-strategy-button {",
			"	height: 20px;",
			"	padding: 0 5px;",
			"	border: 1px solid rgba(215, 241, 255, 0.75);",
			"	border-radius: 5px;",
			"	background: rgba(16, 31, 43, 0.92);",
			"	color: #d7f1ff;",
			"	font-family: Arial, sans-serif;",
			"	font-size: 11px;",
			"	font-weight: 700;",
			"	line-height: 18px;",
			"	text-align: center;",
			"	cursor: pointer;",
			"	pointer-events: auto;",
			"	touch-action: manipulation;",
			"}",
			".battery-strategy-mode {",
			"	min-width: 72px;",
			"}",
			".battery-strategy-manual {",
			"	width: 22px;",
			"	padding: 0;",
			"	font-size: 13px;",
			"}",
			".battery-strategy-button[data-active='1'] {",
			"	background: rgba(255, 213, 94, 0.94);",
			"	border-color: #fff2a8;",
			"	color: #141414;",
			"}",
			".battery-strategy-controls[data-strategy='smart'] .battery-strategy-badge {",
			"	border-color: #78d8ff;",
			"}",
			".battery-strategy-controls[data-strategy='solar_only'] .battery-strategy-badge {",
			"	border-color: #84ff68;",
			"}",
			".battery-strategy-controls[data-strategy='manual_charge'] .battery-strategy-badge,",
			".battery-strategy-controls[data-strategy='manual_discharge'] .battery-strategy-badge {",
			"	border-color: #ffd55e;",
			"}",
			".battery-strategy-controls[data-source='solar'] .battery-strategy-badge {",
			"	background: rgba(20, 70, 25, 0.94);",
			"}",
			".battery-strategy-controls[data-source='grid'] .battery-strategy-badge {",
			"	background: rgba(20, 70, 25, 0.94);",
			"}",
			".battery-strategy-controls[data-source='blocked'] .battery-strategy-badge {",
			"	background: rgba(74, 32, 11, 0.94);",
			"	border-color: #ff7a45;",
			"}",
			".battery-strategy-controls[data-source='discharging'] .battery-strategy-badge {",
			"	background: rgba(80, 18, 18, 0.94);",
			"}"
		].join("\n");

		document.head.appendChild(style);
	}

	function refreshGameficationUI() {
		if (budgetValueElement) {
			budgetValueElement.textContent = budget;
		}

		ensureBatteryStrategyControls();
		updateLearningGoals();
		updateTransformerStatusPanel();
		updateTimeSeasonPanel();
		updateRiskEvents();

		for (let houseNumber = 0; houseNumber < houseCount(); houseNumber++) {
			let control = document.getElementById("houseSlotControl" + houseNumber);
			if (!control) {
				continue;
			}

			let used = getHouseDeviceCount(houseNumber);
			let loadInfo = getHouseLoadInfo(houseNumber);
			let powerWatts = getHousePowerWatts(houseNumber, loadInfo);
			let loadPercent = Math.round(loadInfo.loadRatio * 100);

			control.querySelector(".slot-used").textContent = used;
			control.querySelector(".slot-max").textContent = houseSlots[houseNumber];
			control.classList.toggle("full", used >= houseSlots[houseNumber]);
			control.classList.toggle("load-safe", !loadInfo.burned && loadInfo.loadRatio < HOUSE_LOAD_CAUTION_THRESHOLD);
			control.classList.toggle("load-caution", !loadInfo.burned && loadInfo.loadRatio >= HOUSE_LOAD_CAUTION_THRESHOLD && loadInfo.loadRatio < HOUSE_LOAD_WARNING_THRESHOLD);
			control.classList.toggle("load-warning", !loadInfo.burned && loadInfo.loadRatio >= HOUSE_LOAD_WARNING_THRESHOLD);
			control.classList.toggle("load-overloaded", loadInfo.burned);

			control.querySelector(".house-load-percent").textContent = loadPercent + "%";
			control.querySelector(".house-power-watt").textContent = formatPowerWatts(powerWatts);
			control.querySelector(".house-load-tip").textContent = getHouseLoadTip(houseNumber, used, loadInfo);

			let button = control.querySelector("button");
			button.disabled = budget < GAMEFICATION_CONFIG.slotUpgradeCost;
		}
	}

	function updateTimeSeasonPanel() {
		if (!timeSeasonPanelElement) {
			return;
		}

		let date = getSimulationDate();
		if (timeSeasonTimeElement) {
			timeSeasonTimeElement.textContent = formatSimulationTime(date);
		}
		if (timeSeasonSeasonElement) {
			timeSeasonSeasonElement.textContent = getSeasonName(date);
		}
	}

	function updateTransformerStatusPanel() {
		if (!transformerStatusElement) {
			return;
		}

		let loadInfo = getTransformerLoadInfo();
		let currentElement = transformerStatusElement.querySelector(".transformer-current-amp");
		if (!currentElement) {
			return;
		}

		currentElement.textContent = loadInfo.signedCurrent.toFixed(1) + " A";
		transformerStatusElement.classList.toggle("load-safe", !loadInfo.burned && loadInfo.loadRatio < HOUSE_LOAD_CAUTION_THRESHOLD);
		transformerStatusElement.classList.toggle("load-caution", !loadInfo.burned && loadInfo.loadRatio >= HOUSE_LOAD_CAUTION_THRESHOLD && loadInfo.loadRatio < HOUSE_LOAD_WARNING_THRESHOLD);
		transformerStatusElement.classList.toggle("load-warning", !loadInfo.burned && loadInfo.loadRatio >= HOUSE_LOAD_WARNING_THRESHOLD);
		transformerStatusElement.classList.toggle("load-overloaded", loadInfo.burned);
	}

	function initGamefication() {
		if (initialized) {
			return;
		}

		let board = document.getElementById("board");
		if (!board) {
			return;
		}

		initialized = true;
		for (let houseNumber = 0; houseNumber < houseCount(); houseNumber++) {
			houseSlots[houseNumber] = GAMEFICATION_CONFIG.initialHouseSlots;
		}

		injectGameficationStyles();
		createBudgetPanel(board);
		createEventPanel(board);
		createTimeSeasonPanel(board);
		createLearningGoalPanel(board);
		createDevicePriceTags(board);
		createDevicePowerTags(board);
		createHouseSlotControls(board);
		createMissionOverlay(board);
		refreshGameficationUI();
	}

	window.canDropDeviceToHouse = function (device, houseNumber) {
		let type = getDeviceType(device);
		if (!type) {
			return true;
		}

		let usedSlots = getHouseDeviceCount(houseNumber, device);
		if (usedSlots >= houseSlots[houseNumber]) {
			setMessage("");
			showHouseTipNotice(houseNumber, "Slots full: buy + Slot or use another house.", 3000);
			return false;
		}

		let price = getDevicePrice(device);
		if (!isPurchased(device) && budget < price) {
			setMessage("Not enough coins to buy " + DEVICE_LABELS[type] + ".");
			return false;
		}

		return true;
	};

	window.commitDeviceDrop = function (device, houseNumber) {
		let type = getDeviceType(device);
		if (!type) {
			refreshGameficationUI();
			return true;
		}

		if (!isPurchased(device)) {
			let price = getDevicePrice(device);
			changeBudget(
				"Bought " + DEVICE_LABELS[type] + " for House " + (houseNumber + 1),
				-price
			);
			device.setAttribute("data-game-purchased", "1");
			device.setAttribute("data-game-price", price);
			setMessage("");
		}

		device.setAttribute("data-game-house", houseNumber);
		recordLearningGoalPlacement(type, houseNumber);
		refreshGameficationUI();
		return true;
	};

	window.prepareDeviceHouseLeave = function (device) {
		let currentHouse = parseInt(device.getAttribute("data-house"), 10);
		if (isNaN(currentHouse)) {
			return;
		}

		device.setAttribute("data-game-previous-house", currentHouse);
		device.setAttribute("data-game-previous-x", device.getAttribute("data-x") || "");
		device.setAttribute("data-game-previous-y", device.getAttribute("data-y") || "");
		device.setAttribute("data-game-previous-s", device.getAttribute("data-s") || "");
		device.setAttribute("data-game-previous-z", device.getAttribute("data-z") || "");
		device.setAttribute("data-game-previous-transform", device.style.transform || "");
		window.setTimeout(refreshGameficationUI, 0);
	};

	window.rejectDeviceDrop = function (device, failureMessage) {
		let restored = isPurchased(device) && restoreDeviceToPreviousHouse(device);

		if (!restored) {
			rejectNewDevice(device);
			if (failureMessage) device.remove();
		}

		if (failureMessage) {
			setMessage(failureMessage);
		}
		refreshGameficationUI();
	};

	window.refreshGameficationUI = refreshGameficationUI;
	window.GAMEFICATION_CONFIG = GAMEFICATION_CONFIG;

	if (document.readyState == "loading") {
		document.addEventListener("DOMContentLoaded", initGamefication);
	}
	else {
		initGamefication();
	}
}());
