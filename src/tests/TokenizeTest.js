const fs = require("fs");

const Initializer = require("./../libs/Initializer");
const Tokenizer = require("./../libs/Tokenizer");
const { AsyncArrayLogger } = require("./../libs/Logger");



/** @type {Initializer.ShiinaEnv} */
const ENV = process.env;

const inFile = ENV.IN_PATH.split("/").slice(-1).join("");
const inFileName = inFile.split(".").slice(0, -1).join("");
const outDir = ENV.OUT_DIR ? `${ENV.OUT_DIR}/` : "";

const tokenizer = new Tokenizer({ dicPath: `${ENV.SHIINA_HOMEDIR}/${ENV.SHIINA_DICPATH}` });
const logger = new AsyncArrayLogger(`${ENV.SHIINA_HOMEDIR}/db/${outDir}${inFileName}.db`);

Promise.all([ tokenizer.on("initialized"), logger.on("initialized") ]).then(([ tokenizer, logger ]) => {
	const text = fs.readFileSync(`${ENV.SHIINA_HOMEDIR}/${ENV.IN_PATH}`).toString();
	const tokenizedCollection = tokenizer.tokenize(text, true);

	for (const tokenized of tokenizedCollection) logger.put(tokenized);
	return logger.store();
}).catch(error => { throw error }).then(() => process.kill(process.pid));