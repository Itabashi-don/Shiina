const fs = require("fs");

const Initializer = require("./../libs/Initializer");
const Logger = require("./../libs/Logger");
const Generator = require("./../libs/Generator");



/** @type {Initializer.ShiinaEnv} */
const ENV = process.env;

const logger = new Logger.AsyncArrayLogger(`${ENV.SHIINA_HOMEDIR}/logs/AB.log`);
logger.on("initialized").then(logger => {
	const dic = new Generator(logger.log);
	fs.writeFile(`${ENV.SHIINA_HOMEDIR}/logs/AB_structure.log`, JSON.stringify(dic.structureSet), error => {
		if (error) throw error;

		process.kill(process.pid, "SIGINT");
	});
});