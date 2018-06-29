const fs = require("fs");
const csv = require("csv");
const iconv = require("iconv-lite");



class Logger {
	/**
	 * エンコード変換を行います
	 * 
	 * @param {String} content
	 * @param {Object} options
	 * @param {String} [options.before="UTF-8"]
	 * @param {String} [options.after="UTF-8"]
	 * 
	 * @return {String}
	 */
	static encode (content, options = { before: "UTF-8", after: "UTF-8" }) {
		return iconv.decode(iconv.encode(content, options.before || "UTF-8"), options.after || "UTF-8");
	}



	/**
	 * @param {String} logPath
	 * @param {String} [encoding="UTF-8"]
	 */
	constructor (logPath, encoding = "UTF-8") {
		if (!logPath) throw new TypeError("'logPath'(1st argument) must be String.");
		
		this.path = logPath;
		this.encoding = encoding;

		if (!fs.existsSync(logPath)) fs.writeFileSync(logPath, Logger.encode(this.initialState, { after: encoding }));
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
	 * 
	 * @param {String} logPath
	 * @param {String} [encoding="UTF-8"]
	 */
	constructor (logPath, encoding = "UTF-8") {
		super(logPath, encoding);
	}

	get initialState () { return "[]"; }

	load () {
		/** @type {Array} */
		this.log = JSON.parse(Logger.encode(fs.readFileSync(this.path), { before: this.encoding }));
	}

	store () { fs.writeFileSync(this.path, Logger.encode(JSON.stringify(this.log), { after: this.encoding })); }
	
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
	 * @param {String} [encoding="UTF-8"]
	 * @param {Object} [options={ columns: true }]
	 * 
	 * @return {Promise<Array<Object> | Error>}
	 */
	static csvToJson (csvString, encoding = "UTF-8", options = { columns: true }) {
		const parser = csv.parse(Logger.encode(csvString, { before: encoding }), options);

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
	 * CSVファイルからArrayに変換します
	 * 
	 * @param {String} csvPath
	 * @param {String} [encoding="UTF-8"]
	 * @param {Object} [options={ columns: true }]
	 * 
	 * @return {Promise<Array<Object> | Error>}
	 */
	static csvFileToJson (csvPath, encoding = "UTF-8", options = { columns: true }) {
		return new Promise((resolve, reject) => {
			fs.createReadStream(csvPath)
				.pipe(iconv.decodeStream(encoding))
				.pipe(iconv.encodeStream("UTF-8"))
				.pipe(
					csv.parse((error, parsed) => {
						if (error) reject(error);

						resolve(parsed);
					})
				);
		});
	}

	/**
	 * ArrayからCSV形式文字列に変換します
	 * 
	 * @param {Array} jsonObj
	 * @param {String} [encoding="UTF-8"]
	 * @param {Object} [options={ header: true }]
	 * 
	 * @return {Promise<String | Error>}
	 */
	static jsonToCsv (jsonObj, encoding = "UTF-8", options = { header: true }) {
		const stringifier = csv.stringify(jsonObj, options);

		return new Promise((resolve, reject) => {
			let stringified = "";

			stringifier.on("readable", () => {
				let mem;
				while ((mem = stringifier.read())) stringified += Logger.encode(mem, { after: encoding });
			});

			stringifier.on("error", error => reject(error));
			stringifier.on("end", () => resolve(stringified));
		});
	}



	/**
	 * CsvLoggerを生成します
	 * 
	 * @param {String} logPath
	 * @param {String} [encoding="UTF-8"]
	 */
	constructor (logPath, encoding = "UTF-8") {
		super(logPath, encoding);

		this.initialized = false;
	}

	get initialState () { return ""; }

	load () {
		CsvLogger.csvFileToJson(this.path, this.encoding).then(parsed => {
			/** @type {Array<Object>} */
			this.log = parsed;
			this.initialized = true;
		});
	}

	/** @return {Promise<void>} */
	store () {
		return CsvLogger.jsonToCsv(this.log).then(stringified => {
			const buf = iconv.encode(stringified, this.encoding);
			fs.writeSync(fs.openSync(this.path, "w"), buf, 0, buf.length);
		});
	}
	
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
	toCsv () { return CsvLogger.jsonToCsv(this.log, this.encoding); }
}



module.exports = { ArrayLogger, CsvLogger };