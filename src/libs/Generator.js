const Kuromoji = require("kuromoji");



/**
 * 学習データを基にして文章合成を行うクラス
 * @author Genbu Hase
 */
class Generator {
	/**
	 * Generatorを生成します
	 * @param {Kuromoji.IpadicFeatures[][]} dbData 取り込む形態素解析データ
	 */
	constructor (dbData) {
		/**
		 * 形態素解析データを基に生成された辞書
		 * @type {Dictionary}
		 */
		this.dictionary = new Dictionary();

		if (dbData) this.importDatabase(dbData);
	}

	/**
	 * 形態素解析データを取り込みます
	 * @param {Kuromoji.IpadicFeatures[][]} dbData 取り込む形態素解析データ
	 */
	importDatabase (dbData) {
		for (const tokenized of dbData) this.dictionary.register(tokenized);
	}

	/**
	 * 文章を生成します
	 * 
	 * @param {String} [vocabulary=""] 開始する単語
	 * @param {String[]} [structure=[]] 文章の文法構造
	 * 
	 * @return {String} 生成された文章
	 */
	generate (vocabulary = "", structure = []) {
		const { dictionary } = this;

		const nounDic = dictionary.vocabularies.orderBy({ pos: "名詞" });
		const verbDic = dictionary.vocabularies.orderBy({ pos: "動詞" });

		const structureBase = structure.length ? structure : dictionary.structures.pickUp();
		
		let sentence = "";
		for (const token of structureBase) {
			if (!["名詞", "動詞"].includes(token.pos)) {
				sentence += token.surface_form;
			} else {
				sentence += dictionary.vocabularies.orderBy({ pos: token.pos }).pickUp().surface_form;
			}
		}

		return sentence;
	}
}

/**
 * 学習データの辞書
 * @author Genbu Hase
 */
class Dictionary {
	/** Dictionaryを生成します */
	constructor () {
		/**
		 * 語彙辞書
		 * @type {VocabularyDictionary}
		 */
		this.vocabularies = new VocabularyDictionary();

		/**
		 * 文法構造辞書
		 * @type {StructureDictionary}
		 */
		this.structures = new StructureDictionary();
	}

	/**
	 * 解析結果を登録します
	 * @param {Kuromoji.IpadicFeatures[]} tokenized 文章の形態素解析結果
	 */
	register (tokenized) {
		this.vocabularies.register(tokenized);
		this.structures.register(tokenized);
	}
}

/**
 * 語彙データの辞書
 * 
 * @extends Array<Kuromoji.IpadicFeatures>
 * @author Genbu Hase
 */
class VocabularyDictionary extends Array {
	constructor () { super() }

	/**
	 * 語彙データを登録します
	 * @param {Kuromoji.IpadicFeatures[]} tokenized 文章の形態素解析結果
	 */
	register (tokenized) { this.push(...tokenized) }

	/**
	 * 語彙データをランダムで抽出します
	 * @return {Kuromoji.IpadicFeatures}
	 */
	pickUp () { return this[Math.floor(Math.random() * this.length)] }

	/**
	 * 指定された条件が満たされる語彙で構成された辞書を返します
	 * 
	 * @param {Object} conditions 満たされる条件
	 * @return {VocabularyDictionary} 構成された辞書
	 */
	orderBy (conditions = {}) {
		return this.filter(vocab => {
			for (const prop in conditions) {
				if (vocab[prop] !== conditions[prop]) return false;
			}

			return true;
		});
	}
}

/**
 * 文法構造データの辞書
 * 
 * @extends Array<Array<Kuromoji.IpadicFeatures>>
 * @author Genbu Hase
 */
class StructureDictionary extends Array {
	constructor () { super() }

	/**
	 * 文法構造データを登録します
	 * @param {Kuromoji.IpadicFeatures[]} tokenized 文章の形態素解析結果
	 */
	register (tokenized) { this.push(tokenized) }

	/**
	 * 文法構造データをランダムで抽出します
	 * @return {Kuromoji.IpadicFeatures[]}
	 */
	pickUp () { return this[Math.floor(Math.random() * this.length)] }
}



module.exports = Generator;