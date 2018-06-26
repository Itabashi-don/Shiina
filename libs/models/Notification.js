const Types = require("./Types");
const Account = require("./Account");
const Status = require("./Status");



/**
 * See https://github.com/tootsuite/documentation/blob/master/Using-the-API/API.md#notification
 * @class Notification @extends Object
 */
class Notification extends Object {
	/**
	 * Notificationモデルを生成
	 * @param {Types.Notifirable} data
	 */
	constructor (data) {
		Object.assign(super(), data);

		this.account = new Account(this.account);
		if (this.status) this.status = new Status(this.status);
	}
}

module.exports = Notification;