const childProcess = require("child_process");
const express = require("express");
const bodyParser = require("body-parser");
const Mastodon = require("mastodon-api");

const Initializer = require("./libs/Initializer");
const { PayloadNotAcceptableError } = require("./libs/ShiinaError");
const Logger = require("./libs/Logger");
const Tokenizer = require("./libs/Tokenizer");
const Generator = require("./libs/Generator");

const Types = require("./models/Types");
const MorphableStatus = require("./models/MorphableStatus");
const Notification = require("./models/Notification");



/** @type {Initializer.ShiinaEnv} */
const ENV = process.env;

const dialogue = new Logger.AsyncArrayLogger(`${ENV.SHIINA_HOMEDIR}/${ENV.SHIINA_DBPATH}`);
const tokenizer = new Tokenizer({ dicPath: `${ENV.SHIINA_HOMEDIR}/dict` });
const generator = new Generator();

const mstdn = new Mastodon({ api_url: `${ENV.SHIINA_INSTANCE}/api/v1/`, access_token: ENV.SHIINA_TOKEN });

Promise.all([ dialogue.on("initialized"), tokenizer.on("initialized") ]).then(() => {
	console.info("Loading had been completed.");

	generator.importDatabase(dialogue.log);
}).then(() => {
	const tl = mstdn.stream(ENV.SHIINA_MODE === "learning" ? "streaming/public" : "streaming/user");
	tl.on("error", error => { throw error });

	tl.on("message", /** @param {Types.Stream} stream */ stream => {
		if (stream.event === "update") {
			if (ENV.SHIINA_ENV === "development" && ENV.SHIINA_MODE === "learning") {
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

				return mstdn.post("statuses", {
					status: [
						`@${account.acct}`,
						generator.generate()
					].join("\r\n"),

					sensitive,
					spoiler_text,
					in_reply_to_id: id,
					visibility
				});
			}
		}
	});

	return;
}).then(() => {
	const app = express();

	app.use(bodyParser.json());
	app.use("/", express.static(`${ENV.SHIINA_HOMEDIR}/src/views`));

	app.post("/api/register", (req, res) => {
		const { text } = req.body;

		if (!text || typeof text !== "string") {
			return res.status(400).end(JSON.stringify({
				state: "failure",
				error: new PayloadNotAcceptableError("text", "String").message
			}));
		}

		const tokenized = tokenizer.tokenize(text);
		generator.dictionary.register(tokenized);

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

	return app;
}).then(app => {
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
});