const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const Mastodon = require("mastodon-api");

const Initialize = require("./libs/Initialize");
const Logger = require("./libs/Logger");
const TokenizerPlus = require("./libs/TokenizerPlus");
const Generator = require("./libs/Generator");

const Types = require("./libs/models/Types");
const MorphableStatus = require("./libs/models/MorphableStatus");
const Notification = require("./libs/models/Notification");



/**
 * @typedef {Object} ShiinaEnv
 * @prop {String} SHIINA_INSTANCE 動作させるアカウントがあるインスタンスのURL
 * @prop {String} SHIINA_TOKEN 動作させるアカウントのトークン
 * @prop {String} SHIINA_ENV 動作環境
 * @prop {String} SHIINA_MODE 動作モード
 * @prop {String} SHIINA_LOGPATH 学習状況を保存するファイルのパス
 * @prop {Number} SHIINA_PORT Shiinaを動かすポート
 */

/** @const {ShiinaEnv} */
const ENV = process.env;

//const logger = new Logger.ArrayLogger(`${__dirname}/${ENV.SHIINA_LOGPATH}`);
const dialogue = JSON.parse(fs.readFileSync(`${__dirname}/logs/dialogue.log`));
const generator = new Generator(dialogue);

/** @const {TokenizerPlus} */
let tokenizer = new TokenizerPlus({ dicPath: `${__dirname}/node_modules/kuromoji/dict` });
	tokenizer.on("initialized").then(() => console.info("Tokenizer is ready."));

/** @const {Mastodon} */
const mstdn = new Mastodon({ api_url: `${ENV.SHIINA_INSTANCE}/api/v1/`, access_token: ENV.SHIINA_TOKEN });

let homeTimeline = mstdn.stream(ENV.SHIINA_MODE === "learning" ? "streaming/public" : "streaming/user");
	homeTimeline.on("error", error => { throw error; });
	
	homeTimeline.on("message",
		/** @param {Types.Stream} stream */
		stream => {
			if (ENV.SHIINA_ENV === "development" && ENV.SHIINA_MODE === "learning") {
				if (stream.event === "update" && tokenizer.initialized) {
					const status = new MorphableStatus(stream.data);
					
					if (!status.account.bot && status.language === "ja") {
						const tokenized = tokenizer.tokenize(status.morphableContent);
						dialogue.push(tokenized);

						fs.writeFileSync(`${__dirname}/logs/dialogue.log`, JSON.stringify(dialogue));
						console.info(dialogue.length);
						
						return;
					}
				}
			}

			if (stream.event !== "notification") return;
			
			const notify = new Notification(stream.data);
			if (notify.type === "mention") {
				const { account, id, sensitive, spoiler_text, visibility } = notify.status;

				mstdn.post("statuses", {
					status: [
						`@${account.acct}`,
						"お呼びですかーっ！？？✌︎('ω'✌︎ )"
					].join("\r\n"),

					sensitive,
					spoiler_text,
					in_reply_to_id: id,
					visibility
				});
			}
		}
	);



let app = express();
	app.use(bodyParser.json());
	app.use("/", express.static(`${__dirname}/views`));

	app.post("/register", (req, res) => {
		const { text } = req.body;

		if (!tokenizer.initialized) {
			res.status(503).end(JSON.stringify({
				state: "failure",
				error: "Tokenizer hasn't initialized."
			}));

			return;
		}

		if (!text) {
			res.status(400).end(JSON.stringify({
				state: "failure",
				error: "'text'(A payload) must be String."
			}));

			return;
		}

		const tokenized = tokenizer.tokenize(text);
		generator.register(tokenized);

		res.end(JSON.stringify({
			state: "success",
			tokenized
		}));
	});

	app.post("/generate", (req, res) => {
		const { text, isAdvanced } = req.body;

		res.end(JSON.stringify({
			state: "success",
			text: generator.generate(text, isAdvanced)
		}));
	});

	app.post("/next", (req, res) => {
		const { text } = req.body;

		res.end(JSON.stringify({
			state: "success",
			word: generator.next(text)
		}));
	});

	app.get("/tokenize", (req, res) => {
		const { text, mode } = req.query;

		const tokenized = tokenizer.tokenize(text);

		if (!mode || mode === "short") {
			res.end(JSON.stringify(tokenized));
		} else if (mode === "long") {
			const sentences = [];

			let i1 = 0, i2 = tokenized.length;
			while ((i2 = tokenized.slice(i1, i2).findIndex(word => word.basic_form === "。")) !== -1) {
				sentences.push(tokenized.slice(i1, i1 + i2 + 1));

				i1 += i2 + 1;
				i2 = tokenized.length;
			}
			sentences.push(tokenized.slice(i1, tokenized.length));

			res.end(JSON.stringify(sentences));
		}
	});

app.listen(ENV.SHIINA_PORT, () => {
	console.log(`[Shiina | ${ENV.SHIINA_ENV}${ENV.SHIINA_MODE ? `(with ${ENV.SHIINA_MODE})` : ""}] おはよーっ！！ポート${ENV.SHIINA_PORT}で待ってるねっ♡(´˘\`๑)`);

	if (ENV.SHIINA_ENV === "production") {
		return mstdn.post("statuses", {
			status: "板橋の民おはよっ！！"
		});
	}

	switch (ENV.SHIINA_MODE) {
		case "learning":
			return mstdn.post("statuses", {
				status: "自習するぞーっ！",
				visibility: "unlisted"
			});
	}
});