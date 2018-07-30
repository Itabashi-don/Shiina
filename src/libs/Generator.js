const Kuromoji = require("kuromoji");



/**
 * 学習データを基にして文章合成を行うクラス
 * @author Genbu Hase
 */
class Generator {
	/**
	 * Generatorを生成します
	 * @param {Kuromoji.IpadicFeatures[][]} logData 取り込むログデータ
	 */
	constructor (logData) {
		/**
		 * ログデータから抽出された単語辞書
		 * @type {Dictionary}
		 */
		this.dictionary = new Dictionary();

		/**
		 * 単語間連結リスト
		 * @type {Object<string, Kuromoji.IpadicFeatures[]>}
		 */
		this.wordSet = {};

		/**
		 * 文法構造体セット
		 * @type {String[][]}
		 */
		this.structureSet = [];

		if (logData) this.importLog(logData);
	}

	/**
	 * データの登録を行います
	 * @param {Kuromoji.IpadicFeatures[]} tokenized 文章の分析結果
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
	 * @param {Kuromoji.IpadicFeatures[][]} logData 取り込むログデータ
	 */
	importLog (logData) {
		for (const sentence of logData) this.register(sentence);
	}

	/**
	 * 次に結合する文字を返します
	 * 
	 * @param {String} [word=""] 結合させる単語
	 * @param {String | null} [structure=null] 結合する単語の品詞
	 * 
	 * @return {Kuromoji.IpadicFeatures} 結合する単語
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
	 * @param {String} [word=""] 開始する単語
	 * @param {String[]} [structures=[]] 文章の文法構造
	 * 
	 * @return {String} 合成された文章
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
 * @extends Array<Kuromoji.IpadicFeatures>
 * @author Genbu Hase
 */
class Dictionary extends Array {
	/**
	 * Dictionaryを生成します
	 * @param {Kuromoji.IpadicFeatures[]} logData 取り込むログデータ
	 */
	constructor (logData) {
		super(...logData);
	}

	/**
	 * 指定された条件を満たした単語で構成された辞書を返します
	 * 
	 * @param {Object} conditions 単語の条件
	 * @return {Dictionary} 条件を満たした単語で構成された辞書
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
	 * 指定された品詞の単語で構成された辞書を返します
	 * 
	 * @param {String} type 品詞
	 * @return {Dictionary} 特定の品詞の単語で構成された辞書
	 */
	orderByStructure (type) {
		return this.filter(word => word.pos === type);
	}
}

/**
 * 単語構造を格納するオブジェクト
 * @author Genbu Hase
 */
class Structure {
	static get DELIMITOR () { return "/" }

	/**
	 * 指定されたStructureからマッチ条件を生成します
	 * @param {Structure} structure
	 */
	static createCondition (structure) {
		const structures = structure.structure.split(Structure.DELIMITOR);
		const [ pos = "*", pos_detail_1 = "*", pos_detail_2 = "*", pos_detail_3 = "*" ] = structures;

		return { pos, pos_detail_1, pos_detail_2, pos_detail_3 };
	}



	/**
	 * Structureを生成します
	 * @param {Kuromoji.IpadicFeatures} word
	 */
	constructor (word) {
		this.word = word;
	}

	get structure () {
		const { pos, pos_detail_1, pos_detail_2, pos_detail_3 } = this.word;

		let structure = pos;
		for (const detail of [ pos_detail_1, pos_detail_2, pos_detail_3 ]) {
			if (detail && detail !== "*") structure += Structure.DELIMITOR + detail;
		}

		return structure;
	}
}



module.exports = Generator;