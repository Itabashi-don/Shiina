const fs = require("fs");
const Iconv = require("iconv-lite");



class Logger {
	constructor (logPath) {
		if (!logPath) throw new TypeError("'logPath'(1st argument) must be String.");

		this.path = logPath;
		if (!fs.existsSync(logPath)) fs.appendFileSync(logPath, this.initialState);
	}

	/**
	 * ログファイルの初期値
	 * @return {String}
	 */
	get initialState () { return ""; }
	
	/** 全ログを返します */
	get () { return this.log; }

	/** ログを再読み込みして返します */
	reload () {
		const { path, log } = this;

		this.log = JSON.parse(fs.readFileSync(path));
		return log;
	}

	/** ログを追加します */
	put () {}
}

class ArrayLogger extends Logger {
	/**
	 * ArrayLoggerを生成します
	 * @param {String} logPath
	 */
	constructor (logPath) {
		super(logPath);

		/** @type {Array} */
		this.log = JSON.parse(fs.readFileSync(logPath));
	}

	get initialState () { return "[]"; }

	/** @return {Array} */
	get () { return super.get(); }
	/** @return {Array} */
	reload () { return super.reload(); }

	/** @param {Object} obj */
	put (obj) {
		const { path, log } = this;

		log.push(obj);
		fs.writeFile(path, JSON.stringify(log), () => {});
	}
}

class ObjectLogger extends Logger {
	/**
	 * ObjectLoggerを生成します
	 * @param {String} logPath
	 */
	constructor (logPath) {
		super(logPath);

		/** @type {Object} */
		this.log = JSON.parse(fs.readFileSync(logPath));
	}

	get initialState () { return "{}"; }

	/** @return {Object} */
	get () { return super.get(); }
	/** @return {Object} */
	reload () { return super.reload(); }

	/**
	 * @param {String} key
	 * @param {Object} value
	 */
	put (key, value) {
		const { path, log } = this;

		log[key] = value;
		fs.writeFile(path, JSON.stringify(log), () => {});
	}
}

class CsvLogger extends Logger {
	/**
	 * CSV形式文字列からObjectに変換します
	 * 
	 * @param {String} csvString
	 * @return {Object}
	 */
	static csvToJson (csvString) {
		csvString.split(/"([^"]+)",?/g);
	}

	/**
	 * ObjectからCSV形式文字列に変換します
	 * 
	 * @param {Object} jsonObj
	 * @return {String}
	 */
	static jsonToCsv (jsonObj) {
		if (!jsonObj) throw new TypeError("'jsonObj'(1st argument) must be Array or Object.");
		const formatted = [];

		const props = Object.entries(jsonObj);
		for (const prop of props) formatted.push(`"${prop[1]}"`);

		return formatted.join(",");
	}



	/**
	 * CsvLoggerを生成します
	 * @param {String} logPath
	 */
	constructor (logPath) {
		super(logPath);
	}

	get initialState () { return ""; }
}



module.exports = { ArrayLogger, ObjectLogger, CsvLogger };