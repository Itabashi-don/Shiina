const Types = require("./Types");
const Account = require("./Account");
const Status = require("./Status");



/**
 * See https://github.com/tootsuite/documentation/blob/master/Using-the-API/API.md#notification
 * @extends Object
 */
class Notification extends Object {
	/**
	 * Notificationモデルを生成
	 * @param {Types.Notifirable} data
	 */
	constructor (data) {
		data.account = new Account(data.account);
		if (data.status) data.status = new Status(data.status);
		
		Object.assign(super(), data);
	}
}



module.exports = Notification;