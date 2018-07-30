const fs = require("fs");
const csv = require("csv");
const iconv = require("iconv-lite");

const { ArgumentNotAcceptableError } = require("./Errors");



/**
 * ログ処理を行うクラス
 * @author Genbu Hase
 */
class Logger {
	/**
	 * エンコード変換を行います
	 * 
	 * @param {String} content 変換する文章
	 * @param {Object} options 変換オプション
	 * @param {String} [options.before="UTF-8"] 変換前のエンコード
	 * @param {String} [options.after="UTF-8"] 変換後のエンコード
	 * 
	 * @return {String} 変換された文章
	 */
	static encode (content, options = { before: "UTF-8", after: "UTF-8" }) {
		return iconv.decode(iconv.encode(content, options.before || "UTF-8"), options.after || "UTF-8");
	}



	/**
	 * @param {String} logPath ログファイルのパス
	 * @param {String} [encoding="UTF-8"] ログファイルのエンコード
	 */
	constructor (logPath, encoding = "UTF-8") {
		if (typeof logPath !== "string") throw new ArgumentNotAcceptableError("logPath", 1, "String");
		
		this.path = logPath;
		this.encoding = encoding;

		if (!fs.existsSync(logPath)) fs.writeFileSync(logPath, Logger.encode(this.initialState, { after: encoding }));
		this.load();

		this._storeTimer = setInterval(() => this.store(), 10000);
	}

	/**
	 * ログファイルの初期値
	 * @return {String}
	 */
	get initialState () { return "" }

	/**
	 * ログの蓄積数
	 * @return {Number}
	 */
	get length () { return this.log && this.log.length }

	/** ログを読み込みます */
	load () {
		/** 保存されたログ */
		this.log = null;
	}

	/** ログを保存します */
	store () {}

	/**
	 * ログを追加します
	 * @param {Object} obj
	 */
	put (obj) {}

	/**
	 * Loggerを閉じます
	 * @return {undefined}
	 */
	close () {
		clearInterval(this._storeTimer);
		return undefined;
	}
}

/**
 * 非同期でログ処理を行うクラス
 * 
 * @extends Logger
 * @author Genbu Hase
 */
class AsyncLogger extends Logger {
	/**
	 * @param {String} logPath ログファイルのパス
	 * @param {String} [encoding="UTF-8"] ログファイルのエンコード
	 */
	constructor (logPath, encoding = "UTF-8") {
		super(logPath, encoding);

		this.initialized = false;
	}

	/**
	 * イベントを登録します
	 * 
	 * @param {AsyncLogger.EventType} eventType イベント名
	 * @param {AsyncLogger.EventCallback} callback イベント発火時のコールバック
	 * 
	 * @return {Promise<AsyncLogger>} イベント発火時に呼ばれるPromise
	 */
	on (eventType, callback) {
		switch (eventType) {
			default:
				throw new ArgumentNotAcceptableError("eventType", 1, "AsyncLogger.EventType.*");

			case "initialized":
				return new Promise(resolve => {
					const detector = setInterval(() => {
						if (!this.initialized) return;

						clearInterval(detector);

						if (callback) callback(this);
						resolve(this);
					}, 1);
				});
		}
	}
}

/**
 * AsyncLoggerのイベントタイプ
 * @typedef {"initialized"} AsyncLogger.EventType
 */

/**
 * AsyncLoggerのイベントコールバック
 * 
 * @callback AsyncLogger.EventCallback
 * @param {AsyncLogger} logger 発火したイベントの要素
 */



/**
 * 配列を取り扱うロガー
 * 
 * @extends Logger
 * @author Genbu Hase
 */
class ArrayLogger extends Logger {
	/**
	 * ArrayLoggerを生成します
	 * 
	 * @param {String} logPath ログファイルのパス
	 * @param {String} [encoding="UTF-8"] ログファイルのエンコード
	 */
	constructor (logPath, encoding = "UTF-8") {
		super(logPath, encoding);
	}

	get initialState () { return "[]" }

	load () {
		/** @type {Array} */
		this.log = JSON.parse(Logger.encode(fs.readFileSync(this.path), { before: this.encoding }));
	}

	store () { fs.writeFileSync(this.path, Logger.encode(JSON.stringify(this.log), { after: this.encoding })) }
	
	put (obj) {
		this.log.push(obj);
		this.store();
	}
}

/**
 * 配列を取り扱う非同期ロガー
 * 
 * @extends AsyncLogger
 * @author Genbu Hase
 */
class AsyncArrayLogger extends AsyncLogger {
	/**
	 * AsyncArrayLoggerを生成します
	 * 
	 * @param {String} logPath ログファイルのパス
	 * @param {String} [encoding="UTF-8"] ログファイルのエンコード
	 */
	constructor (logPath, encoding = "UTF-8") {
		super(logPath, encoding);
	}

	get initialState () { return "[]" }

	/**
	 * @param {AsyncLogger.EventType} eventType イベント名
	 * @param {AsyncLogger.EventCallback} callback イベント発火時のコールバック
	 * 
	 * @return {Promise<AsyncArrayLogger>} イベント発火時に呼ばれるPromise
	 */
	on (eventType, callback) { return super.on(eventType, callback) }

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

	put (obj) { this.log.push(obj) }
}

/**
 * Csvを取り扱う非同期ロガー
 * 
 * @extends AsyncLogger
 * @author Genbu Hase
 */
class CsvLogger extends AsyncLogger {
	/**
	 * CSV形式文字列からArrayに変換します
	 * 
	 * @param {String} csvString Csv形式文字列
	 * @param {Object} [options] 変換オプション
	 * @param {Boolean} [options.columns=true] 最初行をヘッダーにするかどうか
	 * 
	 * @return {Promise<Array<Object>>} 変換されたデータが格納されたPromise
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
	 * @param {String} csvPath Csvファイルのパス
	 * @param {String} [encoding="UTF-8"] Csvファイルのエンコード
	 * @param {Object} [options] 変換オプション
	 * @param {Boolean} [options.columns=true] 最初行をヘッダーにするかどうか
	 * 
	 * @return {Promise<Array<Object>>} 変換されたデータが格納されたPromise
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
	 * @param {Array} jsonObj 配列オブジェクト
	 * @param {Object} [options] 変換オプション
	 * @param {Boolean} [options.header=true] 最初行にヘッダーを追加するかどうか
	 * 
	 * @return {Promise<String>} 変換されたデータが格納されたPromise
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
	 * @param {String} logPath ログファイルのパス
	 * @param {String} [encoding="UTF-8"] ログファイルのエンコード
	 * @param {Object} [options] Csv変換オプション
	 * @param {Boolean} [options.columns=true] 最初行をヘッダーにするかどうか
	 */
	constructor (logPath, encoding = "UTF-8", options = { columns: true }) {
		super(logPath, encoding);

		this.options = options;
	}

	get initialState () { return "" }

	/**
	 * @param {AsyncLogger.EventType} eventType イベント名
	 * @param {AsyncLogger.EventCallback} callback イベント発火時のコールバック
	 * 
	 * @return {Promise<CsvLogger>} イベント発火時に呼ばれるPromise
	 */
	on (eventType, callback) { return super.on(eventType, callback) }

	load () {
		return CsvLogger.csvFileToJson(this.path, this.encoding, this.options).catch(error => { throw error }).then(parsed => {
			/** @type {Array<Object>} */
			this.log = parsed;
			this.initialized = true;
		});
	}
	
	store () {
		return this.toCsv().catch(error => { throw error }).then(stringified => {
			const buf = iconv.encode(stringified, this.encoding);
			fs.writeSync(fs.openSync(this.path, "w"), buf, 0, buf.length);
		});
	}
	
	put (obj) { this.log.push(obj) }

	/**
	 * Csv形式に変換します
	 * @return {Promise<String>} Csv形式文字列
	 */
	toCsv () { return CsvLogger.jsonToCsv(this.log) }
}



module.exports = { ArrayLogger, AsyncArrayLogger, CsvLogger };