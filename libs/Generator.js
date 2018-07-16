const Kuromoji = require("kuromoji");



/**
 * 学習データを基にして文章合成を行うクラス
 * @author Genbu Hase
 */
class Generator {
	/**
	 * Generatorを生成します
	 * @param {Kuromoji.IpadicFeatures[][]} logData
	 */
	constructor (logData) {
		/** @type {Dictionary} */
		this.dictionary = new Dictionary();
		/** @type {Object<string, Kuromoji.IpadicFeatures[]>} */
		this.wordSet = {};
		/** @type {String[][]} */
		this.structureSet = [];

		if (logData) this.importLog(logData);
	}

	/**
	 * データの登録を行います
	 * @param {Kuromoji.IpadicFeatures[]} tokenized
	 */
	register (tokenized) {
		const { dictionary, wordSet, structureSet } = this;

		Array.prototype.push.apply(dictionary, tokenized);
		structureSet.push(tokenized.map(word => word.pos));

		tokenized.forEach((token, index, parent) => {
			const nowToken = token;
			const prevWord = parent[index - 1] ? parent[index - 1].surface_form : "";

			if (!nowToken) return;

			if (!wordSet[prevWord]) wordSet[prevWord] = [];
			wordSet[prevWord].push(nowToken);
		});
	}

	/**
	 * ログを取り込みます
	 * @param {Kuromoji.IpadicFeatures[][]} logData
	 */
	importLog (logData) {
		for (const sentence of logData) this.register(sentence);
	}

	/**
	 * 次に続く文字を返します
	 * 
	 * @param {String} [word=""]
	 * @param {String | null} [structure=null]
	 * 
	 * @return {Kuromoji.IpadicFeatures}
	 */
	next (word = "", structure = null) {
		const { dictionary, wordSet } = this;

		if (!wordSet[word]) return;

		const words = wordSet[word];
		const structures = words.map(word => word.pos);
		const currentStructure = structures[Math.floor(Math.random() * structures.length)];

		if (!word) {
			const matchedWords = dictionary.orderByStructure(structure || currentStructure);
			return matchedWords[Math.floor(Math.random() * matchedWords.length)];
		}
		
		const matchedWords = words.filter(word => word.pos === (structure || currentStructure));
		return matchedWords[Math.floor(Math.random() * matchedWords.length)];
	}

	/**
	 * 文章を合成します
	 * 
	 * @param {String} [word=""]
	 * @param {String[]} [structures=[]]
	 * 
	 * @return {String}
	 */
	generate (word = "", structures = []) {
		const { structureSet } = this;
		if (!structures.length) structures = structureSet[Math.floor(Math.random() * structureSet.length)];
		
		const content = [ word ];
		
		let next = word;
		let counter = 0;
		while (counter < structures.length && (next = this.next(next, structures[counter]))) {
			next = next.surface_form;
			counter++;

			if (content.length >= 200) break;
			content.push(next);
		}

		return content.join("");
	}
}

/**
 * 学習データの格納オブジェクト
 * 
 * @extends Array
 * @author Genbu Hase
 */
class Dictionary extends Array {
	constructor () {
		super();
	}

	/**
	 * 指定された条件に合う単語を返します
	 * 
	 * @param {Object} conditions
	 * @return {Dictionary}
	 */
	orderBy (conditions = {}) {
		return this.filter(word => {
			for (const prop in conditions) {
				if (word[prop] !== conditions[prop]) return false;
			}

			return true;
		});
	}

	/**
	 * 指定された品詞の単語を返します
	 * 
	 * @param {String} type
	 * @return {Dictionary}
	 */
	orderByStructure (type) {
		return this.filter(word => word.pos === type);
	}
}



module.exports = Generator;