const fs = require("fs");



/**
 * @typedef {Object} ShiinaEnv
 * @prop {String} SHIINA_HOMEDIR Shiinaが動作しているホームディレクトリのパス
 * @prop {String} SHIINA_INSTANCE 動作させるアカウントがあるインスタンスのURL
 * @prop {String} SHIINA_TOKEN 動作させるアカウントのトークン
 * @prop {"production" | "development"} [SHIINA_ENV="production"] 動作環境
 * @prop {"" | "learning" | "debug"} [SHIINA_MODE=""] 動作モード
 * @prop {String} [SHIINA_LOGPATH="logs/dialogue.log"] 学習状況を保存するファイルのパス
 * @prop {Number} [SHIINA_PORT=8001] Shiinaを動かすポート
 */

class Environment {
	//Initialization of environment
	static init () {
		/** @type {ShiinaEnv} */
		const self = process.env;

		self.SHIINA_HOMEDIR = process.cwd();
		self.SHIINA_ENV = self.SHIINA_ENV || "production";
		self.SHIINA_MODE = (self.SHIINA_ENV === "development" && self.SHIINA_MODE) || "";
		self.SHIINA_LOGPATH = self.SHIINA_LOGPATH || "logs/dialogue.log";
		self.SHIINA_PORT = self.SHIINA_PORT || 8001;
		
		if (self.SHIINA_ENV === "development") require("dotenv").config();

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
	static get DIRS () { return ["logs"]; }
	static get FILES () { return [".env"]; }
	static get JSONS () {
		return {
			Object: [],
			Array: []
		};
	}

	//Initialization of directory
	static init () {
		const HOMEDIR = process.cwd();
		const { DIRS, FILES, JSONS } = DirStructure;

		for (let dir of DIRS) if (!fs.existsSync(`${HOMEDIR}/${dir}`)) fs.mkdirSync(`${HOMEDIR}/${dir}`);
		for (let file of FILES) if (!fs.existsSync(`${HOMEDIR}/${file}`)) fs.appendFileSync(`${HOMEDIR}/${file}`, "");

		for (let type in JSONS) {
			for (let json of JSONS[type]) {
				if (fs.existsSync(`${HOMEDIR}/${json}`)) return;

				switch (type) {
					case "Object": return fs.appendFileSync(`${HOMEDIR}/${json}`, "{}");
					case "Array": return fs.appendFileSync(`${HOMEDIR}/${json}`, "[]");
				}
			}
		}
	}
}



module.exports = { Environment, DirStructure };

DirStructure.init();
Environment.init();