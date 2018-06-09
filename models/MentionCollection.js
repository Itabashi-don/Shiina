/** @class MentionCollection @extends Array<Mention> */
class MentionCollection extends Array {
	/**
	 * MentionCollectionモデルを生成
	 * @param {Array<Mention>} mentions
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

/**
 * See https://github.com/tootsuite/documentation/blob/master/Using-the-API/API.md#mention
 * 
 * @typedef {Object} Mention
 * @prop {String} url
 * @prop {String} username
 * @prop {String} acct
 * @prop {Number} id
 */

module.exports = MentionCollection;