const express = require("express");
const fs = require("fs");
const kuromoji = require("kuromoji");
const Mastodon = require("mastodon-api");
const Status = require("./models/Status");
const MorphableStatus = require("./models/MorphableStatus");
const Notification = require("./models/Notification");



//Initialization of environments
process.env.ENV = process.env.ENV || "production";
process.env.MODE = process.env.MODE || "";

if (process.env.ENV == "development") require("dotenv").config();

if (!process.env.INSTANCE) throw new TypeError("An environment, 'INSTANCE' is required.");
if (!process.env.TOKEN) throw new TypeError("An environment, 'TOKEN' is required.");



if (!fs.existsSync("logs/whole.log")) fs.appendFileSync("logs/whole.log", "[]");
const wholeLog = fs.existsSync("logs/whole.log") ? JSON.parse(fs.readFileSync("logs/whole.log")) : [];

/** @type {kuromoji.Tokenizer<kuromoji.IpadicFeatures>} */
let tokenizer = null;
	kuromoji.builder({ dicPath: `${__dirname}/node_modules/kuromoji/dict` }).build((error, _tokenizer) => {
		if (error) throw error;

		tokenizer = _tokenizer;
		console.info("Tokenizer has been ready.");
	});

const mstdn = new Mastodon({
	api_url: `${process.env.INSTANCE}/api/v1/`,
	access_token: process.env.TOKEN
});

let homeTimeline = mstdn.stream(process.env.MODE === "study" ? "streaming/public" : "streaming/user");
	homeTimeline.on("error", error => { throw error; });

	homeTimeline.on("message", stream => {
		//See https://github.com/tootsuite/documentation/blob/master/Using-the-API/Streaming-API.md#event-types
		if (stream.event === "update" && process.env.MODE === "study" && tokenizer) {
			const status = new MorphableStatus(stream.data);
			console.log(status);

			if (status.language !== "ja") return;

			const tokenized = tokenizer.tokenize(status.morphableContent);
			wholeLog.push(tokenized);

			fs.writeFileSync("logs/whole.log", JSON.stringify(wholeLog));
			return;
		}

		if (stream.event !== "notification") return;

		const notify = new Notification(stream.data);
		console.log(notify);

		if (notify.type === "follow") {
			//mstdn.post("follows", { uri: notify.account.fediverseAcct });
		} else if (notify.type === "mention" && notify.status) {
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
	});



let app = express();
	app.set("PORT", process.env.PORT || 8001);

	app.use("/", express.static(`${__dirname}/views`));

	app.get("/log", (req, res) => {
		const { type } = req.query;
		const logPath = `logs/${type}.log`;

		if (!fs.existsSync(logPath)) throw new TypeError(`${logPath}は存在しません。`);

		fs.readFile(logPath, (error, log) => {
			if (error) throw error;
			
			res.end(log);
		});
	});

	app.get("/tokenize", (req, res) => {
		const { content } = req.query;

		res.end(JSON.stringify(tokenizer.tokenize(content)), "UTF-8");
	});

app.listen(app.get("PORT"), () => {
	console.log(`[Shiina] おはよーっ！！ポート${app.get("PORT")}で待ってるねっ♡(´˘\`๑)`);

	/*mstdn.post("statuses", {
		status: "板橋の民おはよっ！！"
	});*/

	if (process.env.MODE === "study") {
		mstdn.post("statuses", {
			status: "学習開始っ！！",
			visibility: "unlisted",

			isEnquete: false,
			enquete_items: ["", "", "", ""]
		});
	}
});