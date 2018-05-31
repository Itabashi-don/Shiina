const fs = require("fs");
const kuromoji = require("kuromoji");
const p = console.log;

const TYPES = ["名詞", "動詞", "形容詞", "副詞", "連体詞", "助詞", "助動詞", "接続詞", "感動詞", "接頭詞", "フィラー", "記号", "その他"];
const logs = {};

TYPES.forEach(type => {
	const logPath = `logs/${type}.log`;

	if (!fs.existsSync(logPath)) fs.appendFileSync(logPath, "[]");
	logs[type] = JSON.parse(fs.readFileSync(logPath));
});

/** @type {Array<Array<Object>>} */
const wholeLog = JSON.parse(fs.readFileSync("logs/whole.log"));

kuromoji.builder({ dicPath: `${__dirname}/node_modules/kuromoji/dict` }).build((error, tokenizer) => {
	if (error) throw error;

	for (let morpheme of wholeLog) {
		for (let word of morpheme) {
			try {
				logs[word.pos].push(word);
			} catch (error) {
				console.warn(word);
				throw error;
			}
		}
	}

	TYPES.forEach(type => {
		const logPath = `logs/${type}.log`;
		fs.writeFileSync(logPath, JSON.stringify(logs[type]));
	});
});