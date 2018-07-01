const fs = require("fs");
const csv = require("csv");
const iconv = require("iconv-lite");



/** @class Logger */
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

		setInterval(() => this.store(), 10000);
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

/** @class AsyncLogger @extends Logger */
class AsyncLogger extends Logger {
	/**
	 * @param {String} logPath
	 * @param {String} [encoding="UTF-8"]
	 */
	constructor (logPath, encoding = "UTF-8") {
		super(logPath, encoding);

		this.initialized = false;
	}

	/**
	 * イベントを登録します
	 * 
	 * @param {"initialized"} eventType
	 * @return {Promise<AsyncLogger>}
	 */
	on (eventType) {
		switch (eventType) {
			default:
				throw new ReferenceError("'eventType'(1st argument) is not acceptable.");

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
}



/** @class ArrayLogger @extends Logger */
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

/** @class AsyncArrayLogger @extends AsyncLogger */
class AsyncArrayLogger extends AsyncLogger {
	/**
	 * AsyncArrayLoggerを生成します
	 * 
	 * @param {String} logPath
	 * @param {String} [encoding="UTF-8"]
	 */
	constructor (logPath, encoding = "UTF-8") {
		super(logPath, encoding);
	}

	get initialState () { return "[]"; }

	/** @return {Promise<void>} */
	load () {
		return new Promise((resolve, reject) => {
			fs.readFile(this.path, (error, data) => {
				if (error) reject(error);

				/** @type {Array} */
				this.log = JSON.parse(Logger.encode(data, { before: this.encoding }));
				this.initialized = true;

				resolve();
			});
		});
	}

	/** @return {Promise<void>} */
	store () {
		const buf = iconv.encode(JSON.stringify(this.log), this.encoding);

		return new Promise((resolve, reject) => {
			fs.write(fs.openSync(this.path, "w"), buf, 0, buf.length, error => {
				if (error) reject(error);

				resolve();
			});
		});
	}

	put (obj) { this.log.push(obj); }
}

/** @class CsvLogger @extends AsyncLogger */
class CsvLogger extends AsyncLogger {
	/**
	 * CSV形式文字列からArrayに変換します
	 * 
	 * @param {String} csvString
	 * @param {Object} [options={ columns: true }]
	 * 
	 * @return {Promise<Array<Object>>}
	 */
	static csvToJson (csvString, options = { columns: true }) {
		const parser = csv.parse(csvString, options);

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
	 * @return {Promise<Array<Object>>}
	 */
	static csvFileToJson (csvPath, encoding = "UTF-8", options = { columns: true }) {
		const parser = csv.parse(options);

		return new Promise((resolve, reject) => {
			const parsed = [];

			parser.on("readable", () => {
				let mem;
				while ((mem = parser.read())) parsed.push(mem);
			});

			parser.on("error", error => reject(error));
			parser.on("end", () => resolve(parsed));
			
			fs.createReadStream(csvPath)
				.pipe(iconv.decodeStream(encoding))
				.pipe(iconv.encodeStream("UTF-8"))
				.pipe(parser);
		});
	}

	/**
	 * ArrayからCSV形式文字列に変換します
	 * 
	 * @param {Array} jsonObj
	 * @param {Object} [options={ header: true }]
	 * 
	 * @return {Promise<String>}
	 */
	static jsonToCsv (jsonObj, options = { header: true }) {
		const stringifier = csv.stringify(jsonObj, options);

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
	 * 
	 * @param {String} logPath
	 * @param {String} [encoding="UTF-8"]
	 */
	constructor (logPath, encoding = "UTF-8") {
		super(logPath, encoding);
	}

	get initialState () { return ""; }

	load () {
		return CsvLogger.csvFileToJson(this.path, this.encoding).catch(error => { throw error; }).then(parsed => {
			/** @type {Array<Object>} */
			this.log = parsed;
			this.initialized = true;
		});
	}
	
	store () {
		return this.toCsv().catch(error => { throw error; }).then(stringified => {
			const buf = iconv.encode(stringified, this.encoding);
			fs.writeSync(fs.openSync(this.path, "w"), buf, 0, buf.length);
		});
	}
	
	put (obj) { this.log.push(obj); }

	/**
	 * Csv形式に変換します
	 * @return {Promise<String>}
	 */
	toCsv () { return CsvLogger.jsonToCsv(this.log); }
}



module.exports = { ArrayLogger, AsyncArrayLogger, CsvLogger };