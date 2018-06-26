const Kuromoji = require("kuromoji");
const negaposiAnalyze = require("negaposi-analyzer-ja");




/**
 * @class TokenizerPlus
 */
class TokenizerPlus {
	/**
	 * TokenizerPlusを生成します
	 * @param {Kuromoji.Tokenizer<Kuromoji.IpadicFeatures>} kuromojiTokenizer
	 */
	constructor (kuromojiTokenizer) {
		this.self = kuromojiTokenizer;
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