const Types = require("./Types");



/** @class MentionCollection @extends Array<Types.Mention> */
class MentionCollection extends Array {
	/**
	 * MentionCollectionモデルを生成
	 * @param {Array<Types.Mention>} mentions
	 */
	constructor (mentions) {
		Object.assign(super(), mentions);
	}

	/**
	 * 全メンションを文字列に変換
	 * @returns {String}
	 */
	toString () {
		const mentions = [];
		this.forEach(mention => mentions.push(`@${mention.acct}`));

		return mentions.join(" ");
	}
}



module.exports = MentionCollection;