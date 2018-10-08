/**
 * Learning | Mastodon
 * 
 * [Environments]
 * SHIINA_ENV*
 * > SHIINA_INSTANCE*
 * > SHIINA_TOKEN*
 * 
 * SHIINA_DBPATH*: 解析結果の保存先
 * USER_ID*: 収集するユーザーのID
 */



const Mastodon = require("mastodon-api");

const Initializer = require("./../../libs/Initializer");
const Tokenizer = require("./../../libs/Tokenizer");
const Logger = require("./../../libs/Logger");

const Types = require("./../../models/Types");
const MorphableStatus = require("./../../models/MorphableStatus");



class Formatter {
	static getLinkFromLinkHeader (linkHeader = "", type = "next") {
		const link = linkHeader.match(new RegExp(`<(\\S+)>; rel="${type}"`));
		return link && link[1];
	}

	static queriesToObject (url = "") {
		const queries = url.split("?")[1].split("&");

		let formatted = {};
		for (let query of queries) {
			let [ key, value ] = query.split("=");

			formatted[key] = value;
		}

		return formatted;
	}
}



/** @type {Initializer.ShiinaEnv} */
const ENV = process.env;
const mstdn = new Mastodon({ api_url: `${ENV.SHIINA_INSTANCE}/api/v1/`, access_token: ENV.SHIINA_TOKEN });

const logger = new Logger.AsyncArrayLogger(`${ENV.SHIINA_HOMEDIR}/${ENV.SHIINA_DBPATH}`);
logger.on("initialized").then(() => {
	console.log("[logger] Initialized");

	const tokenizer = new Tokenizer({ dicPath: `node_modules/kuromoji/dict` });
	tokenizer.on("initialized").then(tokenizer => {
		console.log("[tokenizer] Initialized");
		
		(function looper (max_id) {
			mstdn.get(`accounts/${ENV.USER_ID}/statuses`, { limit: 40, max_id }).then(res => {
				/** @type {Array<Types.Statusable>} */
				const statuses = res.data;

				for (const statusable of statuses) {
					const status = new MorphableStatus(statusable);
					const { morphableContent, reblog, application, tags } = status;
					
					if (reblog) continue;
					if (application && application.name === "toot counter") continue;
					if (tags && tags.some(tag => tag.name === "whatyouareplaying" || tag.name === "nowplaying" || tag.name === "mastodononemail" || tag.name === "mastodonrater")) continue;
					if (morphableContent.match(/~~~~~~~~~~/)) continue;

					logger.put(tokenizer.tokenize(morphableContent.replace(/\s/g, "")));
				}

				console.log(`Imported: ${logger.log.length} toots`);

				const nextLink = Formatter.getLinkFromLinkHeader(res.resp.headers.link, "next");
				
				if (nextLink) {
					looper(Formatter.queriesToObject(nextLink).max_id);
				}
			});
		})("");

		logger.store();
	});
});

process.on("SIGINT", () => {
	logger.store().catch(error => { throw error }).then(() => process.kill(process.pid));
});