const fs = require("fs");

class Environment {
	//Initialization of environments
	static init () {
		const self = process.env;

		self.SHIINA_ENV = self.SHIINA_ENV || "production";
		self.SHIINA_MODE = self.SHIINA_MODE || "";
		
		if (self.SHIINA_ENV == "development") require("dotenv").config();

		if (!self.SHIINA_INSTANCE) throw new Environment.EnvironmentError("INSTANCE");
		if (!self.SHIINA_TOKEN) throw new Environment.EnvironmentError("TOKEN");
	}

	static get EnvironmentError () {
		return class EnvironmentError extends TypeError {
			constructor (envName) {
				if (!envName) throw new TypeError("An argument, 'envName' is required.");

				super(`An environment, 'SHIINA_${envName}' is required.`);
			}
		};
	}
}

class DirStructure {
	static get DIRS () { return ["samples", "logs"]; }
	static get FILES () { return []; }
	static get JSONS () {
		return {
			Object: [],
			Array: ["logs/whole.log"]
		};
	}

	//Initialization of directories
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

Environment.init();
DirStructure.init();

module.exports = { Environment, DirStructure };