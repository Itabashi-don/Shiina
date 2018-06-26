const fs = require("fs");



class Environment {
	//Initialization of environment
	static init () {
		const self = process.env;

		self.SHIINA_ENV = self.SHIINA_ENV || "production";
		self.SHIINA_MODE = self.SHIINA_MODE || "";
		self.SHIINA_LOGPATH = self.SHIINA_LOGPATH || "logs/dialogue.log";
		self.SHIINA_PORT = self.SHIINA_PORT || 8001;
		
		if (self.SHIINA_ENV == "development") require("dotenv").config();

		if (!self.SHIINA_INSTANCE) throw new EnvironmentError("INSTANCE");
		if (!self.SHIINA_TOKEN) throw new EnvironmentError("TOKEN");
	}
}

class EnvironmentError extends TypeError {
	/** @param {String} envName */
	constructor (envName) {
		if (!envName) throw new TypeError("An argument, 'envName' is required.");

		super(`An environment, 'SHIINA_${envName}' is required.`);
	}
}



class DirStructure {
	static get DIRS () { return ["samples", "logs"]; }
	static get FILES () { return []; }
	static get JSONS () {
		return {
			Object: [],
			Array: []
		};
	}

	//Initialization of directory
	static init () {
		const { DIRS, FILES, JSONS } = DirStructure;

		for (let dir of DIRS) if (!fs.existsSync(dir)) fs.mkdirSync(dir);
		for (let file of FILES) if (!fs.existsSync(file)) fs.appendFileSync(file, "");

		for (let type in JSONS) {
			for (let json of JSONS[type]) {
				if (fs.existsSync(json)) return;

				switch (type) {
					case "Object": return fs.appendFileSync(json, "{}");
					case "Array": return fs.appendFileSync(json, "[]");
				}
			}
		}
	}
}



module.exports = { Environment, DirStructure };

Environment.init();
DirStructure.init();