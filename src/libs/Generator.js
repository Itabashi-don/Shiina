const Kuromoji = require("kuromoji");



/*
 * 名詞2つ以上連続
 * (名詞/接尾があればそこで区切る)
 * 
 * 北園高校は東京都板橋区にあります。
 * > 北園 + 高校
 * > 東京 + 都(接尾)
 * > 板橋 + 区(接尾)
 */



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
	 * @param {Kuromoji.IpadicFeatures[]} [structure=[]] 文章の文法構造
	 * 
	 * @return {String} 生成された文章
	 */
	generate (vocabulary = "", structure = []) {
		const { dictionary } = this;

		const nounDic = dictionary.vocabularies.orderBy({ pos: "名詞" });
		//const verbDic = dictionary.vocabularies.orderBy({ pos: "動詞" });

		const structureBase = structure.length ? structure : dictionary.structures.pickUp();
		
		let sentence = "";
		for (const token of structureBase) {
			const { pos, pos_detail_1, pos_detail_2, pos_detail_3 } = token;

			switch (true) {
				default:
					sentence += token.surface_form;
					break;

				case pos === "名詞":
					sentence += nounDic.orderBy({ pos_detail_1, pos_detail_2, pos_detail_3 }).pickUp().surface_form;
					break;

				/*case pos === "動詞":
					sentence += verbDic.pickUp().surface_form;
					break;*/
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
	 * @param {Object | VocabularyDictionary.OrderByCallback} conditionsOrCallback 満たされる条件 | 条件判別式
	 * @return {VocabularyDictionary} 構成された辞書
	 */
	orderBy (conditionsOrCallback = {}) {
		return this.filter(vocab => {
			if (typeof conditionsOrCallback === "function") return conditionsOrCallback(vocab);
			
			for (const prop in conditionsOrCallback) {
				if (vocab[prop] !== conditionsOrCallback[prop]) return false;
			}

			return true;
		});
	}
}

/**
 * それぞれの語彙に対し、条件を満たすかどうか確認する関数
 * 
 * @callback VocabularyDictionary.OrderByCallback
 * @param {Kuromoji.IpadicFeatures} vocabulary 語彙
 */



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