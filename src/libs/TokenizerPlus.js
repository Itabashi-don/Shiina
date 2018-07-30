const Kuromoji = require("kuromoji");
const negaposiAnalyze = require("negaposi-analyzer-ja");

const { ArgumentNotAcceptableError, ArgumentNotDefinedError } = require("./Errors");



/**
 * Tokenizerを拡張したクラス
 * @author Genbu Hase
 */
class TokenizerPlus {
	/**
	 * TokenizerPlusを生成します
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
	 * @param {TokenizerPlus.EventType} eventType イベント名
	 * @param {TokenizerPlus.EventCallback} [callback] イベント発火時のコールバック
	 * 
	 * @return {Promise<TokenizerPlus>} イベント発火時に呼ばれるPromise
	 */
	on (eventType, callback) {
		switch (eventType) {
			default:
				throw new ArgumentNotAcceptableError("eventType", 1, "TokenizerPlus.EventType.*");

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
	 * @return {Kuromoji.IpadicFeatures[]} 分析結果
	 */
	tokenize (text) {
		if (typeof text !== "string") throw new ArgumentNotAcceptableError("text", 1, "String");

		const { self } = this;
		
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
 * TokenizerPlusのイベントタイプ
 * @typedef {"initialized"} TokenizerPlus.EventType
 */

/**
 * TokenizerPlusのイベントコールバック
 * 
 * @callback TokenizerPlus.EventCallback
 * @param {TokenizerPlus} tokenizer 発火したイベントの要素
 */



module.exports = TokenizerPlus;