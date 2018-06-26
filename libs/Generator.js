const Kuromoji = require("kuromoji");



/**
 * @class Generator
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

		if (logData) {
			for (const sentence of logData) this.register(sentence);
		}
	}

	/**
	 * データの登録を行います
	 * @param {Kuromoji.IpadicFeatures[]} tokenized
	 */
	register (tokenized) {
		const { dictionary, wordSet, structureSet } = this;

		Array.prototype.push.apply(dictionary, tokenized);
		structureSet.push(tokenized.map(word => word.pos));

		tokenized.forEach((word, index, parent) => {
			const nowWord = word;
			const prevForm = parent[index - 1] ? parent[index - 1].surface_form : "";

			if (!nowWord) return;

			if (!wordSet[prevForm]) wordSet[prevForm] = [];
			wordSet[prevForm].push(nowWord);
		});
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
	 * @param {Boolean} [isAdvanced=false]
	 * 
	 * @return {String}
	 */
	generate (word = "", isAdvanced = false) {
		const { structureSet } = this;
		
		const content = [ word ];
		const structures = structureSet[Math.floor(Math.random() * structureSet.length)];

		let next = word;
		let counter = 0;
		while ((next = this.next(next, isAdvanced ? structures[counter] : null))) {
			next = next.surface_form;
			counter++;

			if (content.length >= 200) break;
			content.push(next);
		}

		return content.join("");
	}
}

/**
 * @class Dictionary @extends Array
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