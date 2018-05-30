//See https://github.com/tootsuite/documentation/blob/master/Using-the-API/API.md#mention
module.exports = class MentionCollection extends Array {
	/**
	 * MentionCollectionモデルを生成
	 * @param {Object} mentions
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
};