const Mastodon = require("mastodon-api");

const Initializer = require("./../libs/Initializer");
const Logger = require("./../libs/Logger");
const Generator = require("./../libs/Generator");



/** @type {Initializer.ShiinaEnv} */
const ENV = process.env;
const mstdn = new Mastodon({ api_url: `${ENV.SHIINA_INSTANCE}/api/v1/`, access_token: ENV.SHIINA_TOKEN });

const generator = new Generator();
const dialogue = new Logger.AsyncArrayLogger(`${ENV.SHIINA_HOMEDIR}/${ENV.SHIINA_LOGPATH}`);
dialogue.on("initialized").then(dialogue => {
	generator.importLog(dialogue.log);

	//Generating texts in non-strict mode
	for (let i = 0; i < 10; i++) {
		const status = [
			generator.generate(""),
			"(In non-strict mode)",
			""
		].join("\r\n");

		console.log(status);

		/*mstdn.post("statuses", {
			status,
			visibility: "private"
		});*/
	}

	//Generating texts in strict mode
	for (let i = 0; i < 10; i++) {
		const status = [
			generator.generate("", true),
			"(In strict mode)",
			""
		].join("\r\n");

		console.log(status);

		/*mstdn.post("statuses", {
			status,
			visibility: "private"
		});*/
	}

	process.kill(process.pid);
});