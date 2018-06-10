const Mastodon = require("mastodon-api");
const htmlToText = require("html-to-text");
const Types = require("./Types");



/**
 * See https://github.com/tootsuite/documentation/blob/master/Using-the-API/API.md#account
 * @class Account @extends Object
 */
class Account extends Object {
	/**
	 * Accountモデルを生成
	 * @param {Types.Accountable} data
	 */
	constructor (data) {
		Object.assign(super(), data);
	}

	/**
	 * 生のBioデータ
	 * @returns {String}
	 */
	get plainNote () {
		return htmlToText.fromString(this.note, { wordwrap: false, ignoreHref: true }).replace(/ \[(https?|ftp):\/\/[-_.!~*¥'()a-zA-Z0-9;¥/?:¥@&=+¥$,%#]+\]/g, "");
	}

	/**
	 * {:ユーザー名}@{:ドメイン}形式のアカウントID
	 * @returns {String}
	 */
	get fediverseAcct () {
		if (this.acct === this.username) {
			return this.url.replace(/(?:https?|ftp):\/\/([-_.!~*¥'()a-zA-Z0-9;¥/?:¥&=+¥$,%#]+)\/@([a-zA-Z0-9\-_]+)/, "$2@$1");
		}

		return this.acct;
	}



	/**
	 * 自分のアカウントを取得
	 * 
	 * @param {Mastodon} mastodonObj
	 * @returns {Promise<Account>}
	 */
	static getMe (mastodonObj) {
		return mastodonObj.get("accounts/verify_credentials").then(res => new Account(res.data));
	}
}

module.exports = Account;