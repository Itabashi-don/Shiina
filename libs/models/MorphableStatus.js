const Types = require("./Types");
const Status = require("./Status");



/** @class MorphableStatus @extends Status */
class MorphableStatus extends Status {
	/**
	 * MorphableStatusモデルを生成
	 * @param {Types.Statusable} data
	 */
	constructor (data) {
		super(data);
	}

	/**
	 * 全てのURL, ハッシュタグ, カスタム絵文字を除いたトゥート内容を返す
	 * @returns {String}
	 */
	get morphableContent () {
		return this.plainContent
			.replace(/(https?|ftp):\/\/[-_.!~*¥'()a-zA-Z0-9;¥/?:¥@&=+¥$,%#]+/g, "")
			.replace(/(?:[^\w:]|^):(@?\w{2,}):(?=[^\w:]|$)/g, "")
			.replace(/(?:^|[^/\w])@((\w+([\w.]+\w+)?)(?:@[\w.-]+\w+)?)/g, "")
			.replace(/(?:^|[^/)\w\u3041-\u3096\u30A1-\u30FA\u3400-\u9FFF])#([\w\u3041-\u3096\u30A1-\u30FA\u3400-\u9FFF·]*)/ig, "");
	}
}

module.exports = MorphableStatus;