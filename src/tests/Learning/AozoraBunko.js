const fetch = require("node-fetch").default;
const iconv = require("iconv-lite");
const htmlToText = require("html-to-text");

const Initializer = require("./../../libs/Initializer");
const Tokenizer = require("./../../libs/Tokenizer");
const Logger = require("./../../libs/Logger");

const parseHtml = htmlStr => {
	htmlStr = htmlStr
		.replace(/<rp>(?:[\s\S](?!<\/ruby>))*[\s\S]/g, "")
		.replace(/<div class="metadata">(?:[\s\S](?!<div id="contents"))*[\s\S]/g, "")
		.replace(/<div class="bibliographical_information">(?:[\s\S](?!<\/body>))*[\s\S]/, "");

	return htmlToText.fromString(htmlStr, {
		wordwrap: null,
		ignoreHref: true,
		ignoreImage: true
	});
};



/** @type {Initializer.ShiinaEnv} */
const ENV = process.env;

const tokenizer = new Tokenizer({ dicPath: `${ENV.SHIINA_HOMEDIR}/${ENV.SHIINA_DICPATH}` });
const logger = new Logger.AsyncArrayLogger(`${ENV.SHIINA_HOMEDIR}/db/aozorabunko.db`);

Promise.all([tokenizer.on("initialized"), logger.on("initialized")]).then(() => {
	return fetch("http://pubserver2.herokuapp.com/api/v0.1/books?limit=1000").then(resp => resp.json()).then(books => {
		return books.filter(book => book.font_kana_type === "新字新仮名" && book.text_url);
	});
}).then(books => {
	let length = 0;

	const ques = [];
	for (const book of books) {
		ques.push(
			fetch(`http://pubserver2.herokuapp.com/api/v0.1/books/${book.book_id}/content?format=html`).then(resp => resp.arrayBuffer()).then(buf => {
				const text = parseHtml(iconv.decode(new Buffer(buf), book.text_encoding));

				const tokenizedCollection = tokenizer.tokenize(text, true);
				for (const tokenized of tokenizedCollection) logger.put(tokenized);

				console.log(++length);
			})
		);
	}

	return Promise.all(ques);
}).then(() => logger.store()).then(() => {
	process.kill(process.pid, "SIGINT");
});