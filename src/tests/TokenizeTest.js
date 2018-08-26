const fs = require("fs");

const Initializer = require("./../libs/Initializer");
const Tokenizer = require("./../libs/Tokenizer");
const { AsyncArrayLogger } = require("./../libs/Logger");



/** @type {Initializer.ShiinaEnv} */
const ENV = process.env;

const tokenizer = new Tokenizer({ dicPath: `${ENV.SHIINA_HOMEDIR}/dict` });
const logger = new AsyncArrayLogger(`${ENV.SHIINA_HOMEDIR}/db/${ENV.DIR_OUT ? ENV.DIR_OUT + "/" : ""}${ENV.PATH_IN.split("/").slice(-1).join("/")}`);

Promise.all([ tokenizer.on("initialized"), logger.on("initialized") ]).then(([ tokenizer, logger ]) => {
	const text = fs.readFileSync(`${ENV.SHIINA_HOMEDIR}/${ENV.PATH_IN}`).toString();
	const tokenizedCollection = tokenizer.tokenize(text, true);

	for (const tokenized of tokenizedCollection) logger.put(tokenized);
	return logger.store();
}).catch(error => { throw error }).then(() => process.kill(process.pid));