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

import os
import importlib

class ModelComposer():
	def __init__(self, name):
		self.fileName = str(name)+"_composed"
		self.dir = os.getcwd()
		self.files = []
		self.clear()

	def clear(self):
		# Check if the file exists
		if os.path.isfile(self.fileName+".py"):
			os.remove(self.fileName+".py")

	def add(self, name):
		self.files.append(name)

	def compose(self):
		# Compose all files into one new source file
		print("Starting model composition into: "+self.fileName+".py")
		output = open(self.fileName+".py", "w")

		for source in self.files:
			print("Adding source: "+source)
			input = open(source, 'r', encoding="utf-8")
			lines = input.readlines()
			output.writelines(lines)
			output.write("\n")
			input.close()

		output.close()
		print("Model composition completed")

	def load(self):
		print("Importing composed model: "+self.fileName)
		importlib.invalidate_caches()
		importlib.import_module(self.fileName)