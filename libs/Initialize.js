const fs = require("fs");

class Environment {
	//Initialization of environments
	static init () {
		const self = process.env;

		self.ENV = self.ENV || "production";
		self.MODE = self.MODE || "";
		
		if (self.ENV == "development") require("dotenv").config();

		if (!self.INSTANCE) throw new Environment.EnvironmentError("INSTANCE");
		if (!self.TOKEN) throw new Environment.EnvironmentError("TOKEN");
	}

	static get EnvironmentError () {
		return class EnvironmentError extends TypeError {
			constructor (envName) {
				if (!envName) throw new TypeError("An argument, 'envName' is required.");

				super(`An environment, '${envName}' is required.`);
			}
		};
	}
}

class DirStructure {
	static get DIRNAMES () { return ["samples", "logs"]; }
	static get FILENAMES () { return ["logs/whole.log"]; }

	//Initialization of directories
	static init () {
		for (let dirName of DirStructure.DIRNAMES) {
			if (!fs.existsSync(dirName)) fs.mkdirSync(dirName);
		}

		for (let fileName of DirStructure.FILENAMES) {
			if (!fs.existsSync(fileName)) fs.appendFileSync(fileName, "");
		}
	}
}

Environment.init();
DirStructure.init();

module.exports = { Environment, DirStructure };