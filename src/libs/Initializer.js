const fs = require("fs");
const fsEx = require("fs-extra");
const { EnvironmentNotDefinedError } = require("./ShiinaError");



class Environment {
	/** 環境変数を初期化します */
	static init () {
		/** @type {ShiinaEnv} */
		const self = process.env;

		self.SHIINA_HOMEDIR = process.cwd();
		self.SHIINA_ENV = self.SHIINA_ENV || "production";
		self.SHIINA_MODE = (self.SHIINA_ENV === "development" && self.SHIINA_MODE) || "";
		self.SHIINA_DBPATH = self.SHIINA_DBPATH || "db/dialogue.db";
		self.SHIINA_DICPATH = self.SHIINA_DICPATH || "dict";
		self.SHIINA_PORT = self.SHIINA_PORT || 8001;
		
		if (self.SHIINA_ENV === "development") require("dotenv").config();

		if (!self.SHIINA_INSTANCE) throw new EnvironmentNotDefinedError("SHIINA_INSTANCE");
		if (!self.SHIINA_TOKEN) throw new EnvironmentNotDefinedError("SHIINA_TOKEN");
	}
}

/**
 * @typedef {Object} ShiinaEnv
 * @prop {String} SHIINA_HOMEDIR Shiinaが動作しているホームディレクトリのパス
 * @prop {String} SHIINA_INSTANCE 動作させるアカウントがあるインスタンスのURL
 * @prop {String} SHIINA_TOKEN 動作させるアカウントのトークン
 * @prop {"production" | "development"} [SHIINA_ENV="production"] 動作環境
 * @prop {"" | "learning" | "debug"} [SHIINA_MODE=""] 動作モード
 * @prop {String} [SHIINA_DBPATH="db/dialogue.db"] 学習状況を保存するファイルのパス
 * @prop {String} [SHIINA_DICPATH="dict"] 形態素解析に用いる辞書のディレクトリパス
 * @prop {Number} [SHIINA_PORT=8001] Shiinaを動かすポート
 */



class DirStructure {
	static get DIRS () { return ["db"] }
	static get FILES () { return [".env"] }
	static get JSONS () {
		return {
			Object: [],
			Array: []
		};
	}

	/** ファイル構成を初期化します */
	static init () {
		const HOMEDIR = process.cwd();
		const { DIRS, FILES, JSONS } = DirStructure;

		for (let dir of DIRS) if (!fs.existsSync(`${HOMEDIR}/${dir}`)) fsEx.mkdirsSync(`${HOMEDIR}/${dir}`);
		for (let file of FILES) if (!fs.existsSync(`${HOMEDIR}/${file}`)) fsEx.createFileSync(`${HOMEDIR}/${file}`);

		for (let type in JSONS) {
			for (let json of JSONS[type]) {
				if (fs.existsSync(`${HOMEDIR}/${json}`)) return;

				switch (type) {
					case "Object": return fs.writeFileSync(`${HOMEDIR}/${json}`, "{}");
					case "Array": return fs.writeFileSync(`${HOMEDIR}/${json}`, "[]");
				}
			}
		}
	}
}



module.exports = { Environment, DirStructure };

DirStructure.init();
Environment.init();