const express = require("express");
const Mastodon = require("mastodon-api");
const Status = require("./models/Status");
const Notification = require("./models/Notification");

//For developing
if (process.env.MODE == "development") require("dotenv").config();

const mstdn = new Mastodon({
	api_url: `${process.env.INSTANCE}/api/v1/`,
	access_token: process.env.TOKEN
});

let homeTimeline = mstdn.stream("streaming/user");
	homeTimeline.on("error", error => { throw error; });

	homeTimeline.on("message", stream => {
		console.log(stream);

		//See https://github.com/tootsuite/documentation/blob/master/Using-the-API/Streaming-API.md#event-types
		if (stream.event === "notification") {
			const notify = new Notification(stream.data);

			if (notify.type === "mention" && notify.status) {
				console.log(notify);

				const { account, id, sensitive, spoiler_text, visibility } = notify.status;

				mstdn.post("statuses", {
					status: [
						`@${account.acct}`,
						"お呼びですかーっ！？？✌︎('ω'✌︎ )"
					].join("\r\n"),

					sensitive,
					spoiler_text,
					in_reply_to_id: id,
					visibility
				});
			}
		}
	});



let app = express();
	app.set("PORT", process.env.PORT || 8001);

app.listen(app.get("PORT"), () => {
	console.log(`[Shiina] おはよーっ！！ポート${app.get("PORT")}で待ってるねっ♡(´˘\`๑)`);

	/*mstdn.post("statuses", {
		status: "板橋の民おはよっ！！"
	});*/
});