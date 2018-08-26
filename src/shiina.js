const childProcess = require("child_process");
const express = require("express");
const bodyParser = require("body-parser");
const Mastodon = require("mastodon-api");

const Initializer = require("./libs/Initializer");
const Logger = require("./libs/Logger");
const Tokenizer = require("./libs/Tokenizer");
const Generator = require("./libs/Generator");

const Types = require("./models/Types");
const MorphableStatus = require("./models/MorphableStatus");
const Notification = require("./models/Notification");



/*
 * 名詞2つ以上連続
 * (名詞/接尾があればそこで区切る)
 * 
 * 北園高校は東京都板橋区にあります。
 * > 北園 + 高校
 * > 東京 + 都(接尾)
 * > 板橋 + 区(接尾)
 */

/** @type {Initializer.ShiinaEnv} */
const ENV = process.env;

const dialogue = new Logger.ArrayLogger(`${ENV.SHIINA_HOMEDIR}/${ENV.SHIINA_DBPATH}`);
const generator = new Generator(dialogue.log);

/** @type {Tokenizer} */
const tokenizer = new Tokenizer({ dicPath: `${ENV.SHIINA_HOMEDIR}/dict` });
tokenizer.on("initialized").then(() => console.info("Tokenizer has been ready."));

/** @type {Mastodon} */
const mstdn = new Mastodon({ api_url: `${ENV.SHIINA_INSTANCE}/api/v1/`, access_token: ENV.SHIINA_TOKEN });

let homeTimeline = mstdn.stream(ENV.SHIINA_MODE === "learning" ? "streaming/public" : "streaming/user");
	homeTimeline.on("error", error => { throw error });
	
	homeTimeline.on("message",
		/** @param {Types.Stream} stream */
		stream => {
			if (stream.event === "update") {
				if (ENV.SHIINA_ENV === "development" && ENV.SHIINA_MODE === "learning") {
					if (!tokenizer.initialized) return;

					const status = new MorphableStatus(stream.data);
					
					if (!status.account.bot && status.language === "ja") {
						const tokenized = tokenizer.tokenize(status.morphableContent);
						dialogue.put(tokenized);

						console.info(dialogue.length);
						return;
					}
				}
			}

			if (stream.event === "notification") {
				const notify = new Notification(stream.data);

				if (notify.type === "mention") {
					const { account, id, sensitive, spoiler_text, visibility, plainContent } = notify.status;

					if (ENV.SHIINA_MODE === "debug") {
						return mstdn.post("statuses", {
							status: [
								`@${account.acct}`,
								eval(plainContent.split(/\r?\n/).slice(1).join("\r\n"))
							].join("\r\n"),

							sensitive,
							spoiler_text,
							in_reply_to_id: id,
							visibility
						});
					}

					/*return mstdn.post("statuses", {
						status: [
							`@${account.acct}`,
							"お呼びですかーっ！？？✌︎('ω'✌︎ )"
						].join("\r\n"),

						sensitive,
						spoiler_text,
						in_reply_to_id: id,
						visibility
					});*/

					return mstdn.post("statuses", {
						status: [
							`@${account.acct}`,
							generator.generate("")
						].join("\r\n"),

						sensitive,
						spoiler_text,
						in_reply_to_id: id,
						visibility
					});
				}
			}
		}
	);



let app = express();
	app.use(bodyParser.json());
	app.use("/", express.static(`${ENV.SHIINA_HOMEDIR}/src/views`));

	app.post("/api/register", (req, res) => {
		const { text } = req.body;

		if (!tokenizer.initialized) {
			return res.status(503).end(JSON.stringify({
				state: "failure",
				error: "Tokenizer has never initialized."
			}));
		}

		if (!text) {
			return res.status(400).end(JSON.stringify({
				state: "failure",
				error: "'text'(In payload) must be String."
			}));
		}

		const tokenized = tokenizer.tokenize(text);
		generator.register(tokenized);

		res.end(JSON.stringify({
			state: "success",
			tokenized
		}));
	});

	app.post("/api/generate", (req, res) => {
		const { text, structure } = req.body;

		res.end(JSON.stringify({
			state: "success",
			text: generator.generate(text, structure)
		}));
	});

	app.post("/api/next", (req, res) => {
		const { text } = req.body;

		res.end(JSON.stringify({
			state: "success",
			word: generator.next(text)
		}));
	});

	app.post("/api/tokenize", (req, res) => {
		const { text, isMultiLine } = req.body;

		if (isMultiLine) {
			const tokenizedCollection = tokenizer.tokenize(text, isMultiLine);
			let propers = [];

			for (const tokenized of tokenizedCollection) propers.push(...tokenizer.detectPropers(tokenized));
			propers = propers.filter((proper, index) => propers.lastIndexOf(proper) === index);

			return res.end(JSON.stringify({ tokenizedCollection, propers }));
		}

		const tokenized = tokenizer.tokenize(text, isMultiLine);
		const propers = tokenizer.detectPropers(tokenized);

		res.end(JSON.stringify({ tokenized, propers }));
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
			/*return mstdn.post("statuses", {
				status: "自習するぞーっ！",
				visibility: "unlisted"
			});*/
	}
});