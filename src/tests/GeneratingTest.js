const fs = require("fs");
const Mastodon = require("mastodon-api");

const Initializer = require("./../libs/Initializer");
const Logger = require("./../libs/Logger");
const Generator = require("./../libs/Generator");



/** @type {Initializer.ShiinaEnv} */
const ENV = process.env;

const mstdn = new Mastodon({ api_url: `${ENV.SHIINA_INSTANCE}/api/v1/`, access_token: ENV.SHIINA_TOKEN });
const generator = new Generator();

const dialogue = new Logger.AsyncArrayLogger(`${ENV.SHIINA_HOMEDIR}/${ENV.SHIINA_DBPATH}`);
dialogue.on("initialized").then(dialogue => {
	generator.importDatabase(dialogue.log);

	const genboo = JSON.parse(fs.readFileSync(`${ENV.SHIINA_HOMEDIR}/db/Itabashi_ProgrammerGenboo.db`));
	for (const tokenized of genboo) generator.dictionary.vocabularies.register(tokenized);

	const friends_nico = JSON.parse(fs.readFileSync(`${ENV.SHIINA_HOMEDIR}/db/friends_nico.db`));
	for (const tokenized of friends_nico) generator.dictionary.vocabularies.register(tokenized);

	const melos = JSON.parse(fs.readFileSync(`${ENV.SHIINA_HOMEDIR}/db/走れメロス.db`));
	for (const tokenized of melos) generator.dictionary.vocabularies.register(tokenized);

	//Generating sentences
	for (let i = 0; i < 10; i++) {
		const status = [
			"== This is the sentence generated by Shiina ==",
			generator.generate()
		].join("\r\n");

		console.log(status);

		/*mstdn.post("statuses", {
			status,
			visibility: "private"
		});*/
	}

	process.kill(process.pid);
});