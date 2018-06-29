const fs = require("fs");
const csv = require("csv");
const iconv = require("iconv-lite");



class Logger {
	/** @param {String} logPath */
	constructor (logPath) {
		if (!logPath) throw new TypeError("'logPath'(1st argument) must be String.");
		
		this.path = logPath;
		if (!fs.existsSync(logPath)) fs.writeFileSync(logPath, this.initialState);

		this.load();
	}

	/**
	 * ログファイルの初期値
	 * @return {String}
	 */
	get initialState () { return ""; }

	/** ログを読み込みます */
	load () { this.log = null; }

	/** ログを保存します */
	store () {}

	/**
	 * ログを追加します
	 * @param {Object} obj
	 */
	put (obj) {}
}

class ArrayLogger extends Logger {
	/**
	 * ArrayLoggerを生成します
	 * @param {String} logPath
	 */
	constructor (logPath) {
		super(logPath);
	}

	get initialState () { return "[]"; }

	load () {
		/** @type {Array} */
		this.log = JSON.parse(fs.readFileSync(this.path));
	}

	store () { fs.writeFileSync(this.path, JSON.stringify(this.log)); }
	
	put (obj) {
		this.log.push(obj);
		this.store();
	}
}

class CsvLogger extends Logger {
	/**
	 * CSV形式文字列からArrayに変換します
	 * 
	 * @param {String} csvString
	 * @param {Object} options
	 * 
	 * @return {Promise<Array<Object> | Error>}
	 */
	static csvToJson (csvString, options) {
		const parser = csv.parse(csvString, options ? options: { columns: true });

		return new Promise((resolve, reject) => {
			const parsed = [];

			parser.on("readable", () => {
				let mem;
				while ((mem = parser.read())) parsed.push(mem);
			});

			parser.on("error", error => reject(error));
			parser.on("end", () => resolve(parsed));
		});
	}

	/**
	 * ArrayからCSV形式文字列に変換します
	 * 
	 * @param {Array} jsonObj
	 * @param {Object} options
	 * 
	 * @return {Promise<String | Error>}
	 */
	static jsonToCsv (jsonObj, options) {
		const stringifier = csv.stringify(jsonObj, options ? options : { header: true });

		return new Promise((resolve, reject) => {
			let stringified = "";

			stringifier.on("readable", () => {
				let mem;
				while ((mem = stringifier.read())) stringified += mem;
			});

			stringifier.on("error", error => reject(error));
			stringifier.on("end", () => resolve(stringified));
		});
	}



	/**
	 * CsvLoggerを生成します
	 * @param {String} logPath
	 */
	constructor (logPath) {
		super(logPath);

		this.initialized = false;
	}

	get initialState () { return ""; }

	load () {
		CsvLogger.csvToJson(fs.readFileSync(this.path)).then(parsed => {
			/** @type {Array<Object>} */
			this.log = parsed;
			this.initialized = true;
		});
	}

	/** @return {Promise<void>} */
	store () { return this.toCsv().then(stringified => fs.writeFileSync(this.path, stringified)); }

	put (obj) {
		if (!this.initialized) throw new ReferenceError("Initializing has never done yet");

		this.log.push(obj);
		this.store();
	}

	/**
	 * イベントフックを登録します
	 * 
	 * @param {"initialized"} eventType
	 * @return {Promise<CsvLogger>}
	 */
	on (eventType) {
		if (!eventType) throw new ReferenceError("'eventType'(1st argument) is not acceptable.");

		switch (eventType) {
			case "initialized":
				return new Promise(resolve => {
					const detector = setInterval(() => {
						if (!this.initialized) return;

						clearInterval(detector);
						resolve(this);
					}, 1);
				});
		}
	}

	/**
	 * Csv形式に変換します
	 */
	toCsv () { return CsvLogger.jsonToCsv(this.log); }
}



module.exports = { ArrayLogger, CsvLogger };