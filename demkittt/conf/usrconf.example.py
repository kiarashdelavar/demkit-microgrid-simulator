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

# Local DEMKit configuration template.
# Copy this file to usrconf.py in this folder (not userconf.py).
# usrconf.py is ignored by Git and should contain only local settings.
# The project paths are calculated from this file's location; they work
# even when the repository is moved or its folder name contains spaces.
from pathlib import Path

cfgVer = 3

_REPO_ROOT = Path(__file__).resolve().parents[2]
componentPath = (_REPO_ROOT / 'demkittt' / 'components').as_posix() + '/'
workspacePath = (_REPO_ROOT / 'workspace').as_posix() + '/'


# Database settings
influxPort = "8086"
influxUrl = "http://localhost"
influxDB = "dem"

# Socket path for networked configurations
sockPath = 'ipc:///home/user/python/'			#linux

#Smart house config
smarthouseUsb = '/dev/ttyACM0'


# CFG 4
demCfg = {}



# ENVIRONMENT PARAMETERS
# Reuse the same paths so legacy DEMKit modules receive consistent locations.
demCfg['env'] = {}
demCfg['env']['path'] = componentPath

demCfg['workspace'] = {}
demCfg['workspace']['path'] = workspacePath


# Database settings
demCfg['db'] = {}

#Influxdb
demCfg['db']['influx'] = {}
demCfg['db']['influx']['address'] = "http://localhost"	# Address of the Influx instance
demCfg['db']['influx']['port'] = "8086"					# Port number of the Influx instance
demCfg['db']['influx']['dbname'] = "dem"				# Database name to writ to

# Preparation for Influx 2.0
demCfg['db']['influx']['username'] = "demkit"			# Username of Influx instance
demCfg['db']['influx']['password'] = ""  # Set locally if needed.
demCfg['db']['influx']['token'] = ""  # Set locally if needed.


# Variable output for logs ans backups (stored within the workspace folder of a model by default)
# Do not forget the traling slash!
demCfg['var'] = {}
demCfg['var']['backup'] = "var/backup/"
demCfg['var']['databasebackup'] = "var/backup/database/"
demCfg['var']['log'] = "var/log/"



# Timezone information
from pytz import timezone
demCfg['timezonestr'] = 'Europe/Amsterdam'
demCfg['timezone'] = timezone(demCfg['timezonestr'])







# OPTIONAL SETTINGS
# These settings are only required for certain cases and normally can remain unchanged

# Socket path for networked configurations
demCfg['network'] = {}
demCfg['network']['sockPath'] = 'ipc:///home/user/python/'			#linux

#Smart house config
demCfg['smarthouse'] = {}
demCfg['smarthouse']['usb'] = '/dev/ttyACM0'




# STATIC SETTINGS
# You should not modify lines below

# Version control, this config is valid for V4 of DEMKit
demCfg['ver'] = 4.1
