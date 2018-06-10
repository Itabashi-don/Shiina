const htmlToText = require("html-to-text");
const Types = require("./Types");
const Account = require("./Account");



/**
 * See https://github.com/tootsuite/documentation/blob/master/Using-the-API/API.md#status
 * @class Status @extends Object
 */
class Status extends Object {
	/**
	 * Statusモデルを生成
	 * @param {Types.Statusable} data
	 */
	constructor (data) {
		Object.assign(super(), data);
		
		this.account = new Account(this.account);
		if (this.reblog) this.reblog = new Status(this.reblog);
	}

	/**
	 * 生の本文データ
	 * @returns {String}
	 */
	get plainContent () {
		return htmlToText.fromString(this.content, { wordwrap: false, ignoreHref: true }).replace(/ \[(https?|ftp):\/\/[-_.!~*¥'()a-zA-Z0-9;¥/?:¥@&=+¥$,%#]+\]/g, "");
	}
}

module.exports = Status;