# DEMKit software
# Copyright (C) 2020 CAES and MOR Groups, University of Twente, Enschede, The Netherlands

# THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND,
# EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
# OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NON
# INFRINGEMENT; IN NO EVENT SHALL LICENSOR BE LIABLE FOR ANY
# CLAIM, DAMAGES OR ANY OTHER LIABILITY ARISING FROM OR IN
# CONNECTION WITH THE SOFTWARE OR THE USE THEREOF.


# Permission is hereby granted, non-exclusive and free of charge, to any person,
# obtaining a copy of the DEMKit-software and associated documentation files,
# to use the Software for NON-COMMERCIAL SCIENTIFIC PURPOSES only,
# subject to the conditions mentioned in the DEMKit License:

# You should have received a copy of the DEMKit License
# along with this program.  If not, contact us via email:
# demgroup-eemcs@utwente.nl.


from hosts.host import Host
from api.eveApi import EveApi
import requests
import json
import time as tm

import sys

from datetime import datetime
from pytz import timezone


# The default JSON encoder does not support complex numbers
class ComplexEncoder(json.JSONEncoder):
	def default(self, z):
		if isinstance(z, complex):
			return {'real': z.real, 'imag': z.imag}
		else:
			return super().default(z)

class PushHost(Host):
	def __init__(self, name = "host", useMaster = False):
		self.liveOperation = False
		self.useMaster = useMaster

		Host.__init__(self, name)

		self.enablePersistence = False
		self.tickInterval = 0.75
		self.timeBase = 900

		self.useThreads = True

		self.port = 3001
		self.address = "http://0.0.0.0"

		self.clients = ['http://localhost:3002']#, 'http://130.89.233.28:3002']
		self.master = None

		self.monthLength = 1  # Length of the month to simulate in days, >31 to simulate all
		self.month = 0
		self.monthIncrease = 1
		self.year = 2019
		self.timeZone = timezone('Europe/Amsterdam')

		self.pause = True
		self.executeControl = False
		self.quitOnError = False

	def startSimulation(self):
		# startup all entities

		self.currentTime = self.startTime
		self.previousTime = self.startTime
		Host.startSimulation(self)

	def runSimulation(self):
		# simulate time
		old = tm.time()

		try:
			while True:
				change = False
				if not self.cmdQueue.empty():
					self.executeCmdQueue()
					change = True

				now = tm.time()
				if not self.pause and now - old >= self.tickInterval:
					change = True

					self.currentTime = self.currentTime + self.timeBase

					if self.currentTime >= int(self.timeZone.localize(datetime(2019, self.month+1, 1)).timestamp()) + (self.monthLength * 24*3600):
						self.month += self.monthIncrease
						self.month = self.month%12
						self.currentTime = int(self.timeZone.localize(datetime(2019, self.month + 1, 1)).timestamp())

					if self.timeObject().hour >= 23 or self.timeObject().hour < 7:
						self.tickInterval = 0.25
					else:
						self.tickInterval = 0.75

					self.logMsg("Simulating at time: " + self.timeHumanReadable())

					self.timeTick(self.currentTime)
					old = now
				else:
					tm.sleep(0.1)

				if change:
					self.push()

		except KeyboardInterrupt:
			print('Interrupted')
			sys.exit(0)

		# do a soft shutdown
		self.shutdown()

	def isMaster(self, clientId):
		# if self.useMaster:
		# 	return clientId == self.master
		# else:
		# 	# When we don't use a master, everyone is a master
		# 	return True
		return True # The system is bugged....

	def startup(self):
		print("start")
		Host.startup(self)

		# Readings at the starting time are available before the clock runs.
		self.timeTick(self.currentTime)
		self.stateJson = self.serializeState()
		self.runInThread(self, 'runSimulation')

		self.restApi = EveApi(self, self.port, self.address, get_state=lambda: self.stateJson)

	def timeTick(self,  time, absolute = True):
		Host.timeTick(self, time, absolute)

		#Now simulate the time
		self.preTickEnvs(time)
		self.preTickDevs(time)
		self.preTickCtrl(time)
		self.preTickComps(time)

		self.timeTickCtrl(time)
		self.timeTickEnvs(time)
		self.timeTickDevs(time)
		self.timeTickMeters(time)
		self.timeTickComps(time)

		self.simulateCosts(time)
		self.simulateFlows(time)

		self.storeStates()

		self.postTickLogging(time)

	def serializeState(self):
		state = {
			'host': {
				'currentTime': self.currentTime,
				'previousTime': self.previousTime,
			},
			'devices': [],
			'controllers': [],
			'environments': [],
			'network': []
		}

		# All properties of any device that the frontend might be interested in
		deviceProperties = ['name', 'devtype', 'consumption', 'soc', 'capacity', 'size', 'efficiency', 'inclination',
			'azimuth', 'hybrid', 'chargingPowers', 'panels', 'wattPeak', 'scaling', 'cop']


		for dev in self.devices:
			properties = dev.getProperties();
			devState = {}
			for prop in deviceProperties:
				if prop in properties:
					devState[prop] = properties[prop]
			state['devices'].append(devState);


		for dev in self.meters:
			properties = dev.getProperties();
			devState = {}
			for prop in deviceProperties:
				if prop in properties:
					devState[prop] = properties[prop]
			state['devices'].append(devState);

		controlProperties = ['name', 'children', 'dev']

		for ctrl in self.controllers:
			ctrlState = {}
			ctrlState['name'] = ctrl.name
			ctrlState['children'] = [child.name for child in ctrl.children]
			ctrlState['dev'] = ctrl.dev.name if ('dev' in vars(ctrl) and ctrl.dev is not None) else ''
			state['controllers'].append(ctrlState)


		environmentProperties = ['name', 'elevation', 'azimuth', 'zenith', 'temperature', 'humidity', 'pressure',
				'windspeed', 'winddirection']

		for env in self.environments:
			envState = {}
			for prop in environmentProperties:
				if prop in vars(env):
					envState[prop] = vars(env)[prop]
			state['environments'].append(envState)


		if len(self.flows) > 0:
			network = self.flows[0]
			networkState = {}
			networkState['edges'] = [{
				'name': e.name,
				'nodes': [n.name for n in e.nodes],
				'ampacity': e.ampacity,
				'direction': e.flowDirection[1],
				'current': abs(e.current[1]),
				'burned': e.burned

			} for e in network.edges]
			networkState['nodes'] = [{
				'name': n.name,
				'edges': [e.name for e in n.edges],
				'voltage': abs(n.getLNVoltage(1)),
				# 'maxVoltage': n.maxVoltage,
				# 'minVoltage': n.minVoltage
			} for n in network.nodes]


			state['network'] = networkState



		return json.dumps(state, cls=ComplexEncoder)

	def push(self):
		self.stateJson = self.serializeState()
		headers = {
			'content-type': 'application/json',
			'Access-Control-Allow-Origin': '*'
		}

		for client in self.clients:
			try:
				requests.post(client + '/dem/state', data=self.stateJson, headers=headers)
			except requests.exceptions.ConnectionError as e:
				print('Can\'t reach client ' + client + ':\n' + str(e))
				# This removes clients we cannot reach. I considered adding a removeClient endpoint,
				# but that would require it to exit cleanly, and there is not way to guarantee that that happens.
				# Additionally, unreachable clients cause quite a bit of delay.
				# self.clients = [x for x in self.clients if not x == client]
