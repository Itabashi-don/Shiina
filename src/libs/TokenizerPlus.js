const Kuromoji = require("kuromoji");
const negaposiAnalyze = require("negaposi-analyzer-ja");



/**
 * @typedef {"initialized"} TokenizerEvent
 */

/**
 * Tokenizerを拡張したクラス
 * @author Genbu Hase
 */
class TokenizerPlus {
	/**
	 * TokenizerPlusを生成します
	 * @param {Kuromoji.TokenizerBuilderOption} option
	 */
	constructor (option) {
		this.self = null;

		Kuromoji.builder(option).build((error, tokenizer) => {
			if (error) throw error;

			this.self = tokenizer;
		});
	}

	get initialized () { return this.self ? true : false; }

	/**
	 * イベントを登録します
	 * 
	 * @param {TokenizerEvent} eventType
	 * @return {Promise<TokenizerPlus>}
	 */
	on (eventType) {
		switch (eventType) {
			case "initialized":
				return new Promise(resolve => {
					const detector = setInterval(() => {
						if (!this.initialized) return;

						clearInterval(detector);
						resolve(this);
					});
				});
		}
	}

	/**
	 * 文章を解析・分解し、単語ごとの感情の正負の値を含めた結果を返します
	 * 
	 * @param {String} text
	 * @return {Kuromoji.IpadicFeatures[]}
	 */
	tokenize (text) {
		const { self } = this;
		
		const tokenized = self.tokenize(text);
		tokenized.forEach((word, index) => tokenized[index].feeling = negaposiAnalyze([ word ]));

		return tokenized;
	}

	/**
	 * 文章全体のポジティブ・ネガティブ度を返します
	 * @param {String} text
	 */
	getFeeling (text) {
		const feelings = this.tokenize(text).map(word => word.feeling);

		let score = 0;
		for (let feeling of feelings) score += feeling;

		return score;
	}
}



module.exports = TokenizerPlus;