const Mastodon = require("mastodon-api");

const Initialize = require("./../libs/Initialize");
const TokenizerPlus = require("./../libs/TokenizerPlus");
const Logger = require("./../libs/Logger");

const Types = require("./../models/Types");
const MorphableStatus = require("./../models/MorphableStatus");



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



/** @type {Initialize.ShiinaEnv} */
const ENV = process.env;
const mstdn = new Mastodon({ api_url: `${ENV.SHIINA_INSTANCE}/api/v1/`, access_token: ENV.SHIINA_TOKEN });

const logger = new Logger.AsyncArrayLogger(`${ENV.SHIINA_HOMEDIR}/${ENV.SHIINA_LOGPATH}`);
logger.on("initialized").then(() => {
	console.log("[logger] Initialized");

	const tokenizer = new TokenizerPlus({ dicPath: `node_modules/kuromoji/dict` });
	tokenizer.on("initialized").then(tokenizer => {
		console.log("[tokenizer] Initialized");
		
		(function looper (max_id) {
			mstdn.get("accounts/2/statuses", { limit: 40, max_id }).then(res => {
				const statuses = res.data;
				
				statuses.forEach(
					/** @param {Types.Statusable} statusable */
					statusable => {
						const status = new MorphableStatus(statusable);
						const { morphableContent, reblog, application, tags } = status;
						
						if (reblog) return;
						if (application && application.name === "toot counter") return;
						if (tags && tags.some(tag => tag.name === "whatyouareplaying" || tag.name === "nowplaying" || tag.name === "mastodononemail" || tag.name === "mastodonrater")) return;

						logger.put(tokenizer.tokenize(morphableContent.replace(/\s/g, "")));
					}
				);

				const nextLink = Formatter.getLinkFromLinkHeader(res.resp.headers.link, "next");

				if (nextLink) {
					const nextId = Formatter.queriesToObject(nextLink).max_id;

					console.info(nextId);
					looper(nextId);
				}
			});
		})("");

		logger.store();
	});
});

process.on("SIGINT", () => {
	logger.store().catch(error => { throw error }).then(() => process.kill(process.pid));
});