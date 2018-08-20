const Kuromoji = require("kuromoji");
const negaposiAnalyze = require("negaposi-analyzer-ja");

const { ArgumentNotAcceptableError, ArgumentNotDefinedError } = require("./ShiinaError");



/**
 * 形態素解析機・改
 * @author Genbu Hase
 */
class Tokenizer {
	/**
	 * Tokenizerを生成します
	 * @param {Kuromoji.TokenizerBuilderOption} option Tokenizerのオプション
	 */
	constructor (option) {
		if (!option) throw new ArgumentNotDefinedError("option", 1);

		this.self = null;
		Kuromoji.builder(option).build((error, tokenizer) => {
			if (error) throw error;

			this.self = tokenizer;
		});
	}

	get initialized () { return this.self ? true : false }

	/**
	 * イベントを登録します
	 * 
	 * @param {Tokenizer.EventType} eventType イベント名
	 * @param {Tokenizer.EventCallback} [callback] イベント発火時のコールバック
	 * 
	 * @return {Promise<Tokenizer>} イベント発火時に呼ばれるPromise
	 */
	on (eventType, callback) {
		switch (eventType) {
			default:
				throw new ArgumentNotAcceptableError("eventType", 1, "Tokenizer.EventType.*");

			case "initialized":
				return new Promise(resolve => {
					const detector = setInterval(() => {
						if (!this.initialized) return;

						clearInterval(detector);

						if (callback) callback(this);
						resolve(this);
					});
				});
		}
	}

	/**
	 * 文章を分析し、単語ごとの感情の正負の値を含めた結果を返します
	 * 
	 * @param {String} text 分析する文章
	 * @param {Boolean} isMultiLine 複数行の文章かどうか
	 * 
	 * @return {Kuromoji.IpadicFeatures[] | Kuromoji.IpadicFeatures[][]} 分析結果
	 */
	tokenize (text, isMultiLine) {
		if (typeof text !== "string") throw new ArgumentNotAcceptableError("text", 1, "String");

		const { self } = this;

		if (isMultiLine) {
			const tokenizedCollection = [];
			const delimiterMatcher = /(\r?\n|。(?:\r?\n)?)/g;

			let prevIndex = 0;
			while (delimiterMatcher.exec(text)) {
				const sentence = text.slice(prevIndex, delimiterMatcher.lastIndex);
				tokenizedCollection.push(this.tokenize(sentence));

				prevIndex = delimiterMatcher.lastIndex;
			}

			return tokenizedCollection;
		}
		
		const tokenized = self.tokenize(text);
		tokenized.forEach((word, index) => tokenized[index].feeling = negaposiAnalyze([ word ]));

		return tokenized;
	}

	/**
	 * 文中に含まれている固有名詞を判別します
	 * 
	 * @param {String | Kuromoji.IpadicFeatures[]} textOrTokenized 分析する文章 | 文章の分析結果
	 * @return {Array<String>} 判別された固有名詞
	 */
	detectPropers (textOrTokenized) {
		if (typeof textOrTokenized === "string") textOrTokenized = this.tokenize(textOrTokenized);

		const existingFlags = textOrTokenized.map(token => token.word_type === "KNOWN");
		const words = textOrTokenized.map(token => token.surface_form);
		const structures = textOrTokenized.map(token => [ token.pos, token.pos_detail_1, token.pos_detail_2, token.pos_detail_3 ]);

		const propers = [];

		let sequenceCount = 0;
		structures.forEach((structure, index) => {
			const prev = structures[index - 1];
			const next = structures[index + 1];

			switch (true) {
				case structure[0] === "名詞":
				case structure[0] === "記号" && structure[1] === "空白" && prev && prev[0] === "名詞":
					switch (true) {
						case 0 < sequenceCount && structure[1] === "接尾" && next && next[1] !== "接尾":
						case 0 < sequenceCount && index === structures.length - 1:
							propers.push({
								type: 1,
								word: words.slice(index - sequenceCount, index + 1).join("")
							});

							return sequenceCount = 0;
					}

					return sequenceCount++;

				default:
					if ((sequenceCount === 1 && !existingFlags[index - 1]) || 1 < sequenceCount) {
						propers.push({
							type: 2,
							word: words.slice(index - sequenceCount, index).join("")
						});
					}

					return sequenceCount = 0;
			}
		});

		return propers;
	}

	/**
	 * 文章全体のポジティブ・ネガティブ度数を返します
	 * 
	 * @param {String | Kuromoji.IpadicFeatures[]} textOrTokenized 分析する文章 | 文章の分析結果
	 * @return {Number} ポジティブ・ネガティブ度数
	 */
	getFeeling (textOrTokenized) {
		if (typeof textOrTokenized === "string") textOrTokenized = this.tokenize(textOrTokenized);

		return textOrTokenized.map(word => word.feeling).reduce((prev, feeling) => prev + feeling);
	}
}

/**
 * Tokenizerのイベントタイプ
 * @typedef {"initialized"} Tokenizer.EventType
 */

/**
 * Tokenizerのイベントコールバック
 * 
 * @callback Tokenizer.EventCallback
 * @param {Tokenizer} tokenizer 発火したイベントの要素
 */



module.exports = Tokenizer;