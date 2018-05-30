const htmlToText = require("html-to-text");
const Account = require("./Account");
const Status = require("./Status");

//See https://github.com/tootsuite/documentation/blob/master/Using-the-API/API.md#notification
module.exports = class Notification extends Object {
	/**
	 * Notificationモデルを生成
	 * @param {Object} notificationData
	 */
	constructor (notificationData) {
		Object.assign(super(), notificationData);

		this.account = new Account(this.account);
		if (this.status) this.status = new Status(this.status);
	}
};