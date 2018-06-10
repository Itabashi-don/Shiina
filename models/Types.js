/**
 * See https://github.com/tootsuite/documentation/blob/master/Using-the-API/API.md#account
 * 
 * @typedef {Object} Accountable
 * @prop {Number} id
 * @prop {String} username
 * @prop {String} acct
 * @prop {String} display_name
 * @prop {Boolean} locked
 * @prop {Number} created_at
 * @prop {Number} followers_count
 * @prop {Number} following_count
 * @prop {Number} statuses_count
 * @prop {String} note
 * @prop {String} url
 * @prop {String} avatar
 * @prop {String} avatar_static
 * @prop {String} header
 * @prop {String} header_static
 * @prop {Accountable | null} [moved]
 * @prop {Array<AccountMetadata>} fields
 * @prop {Boolean} bot
 */

/**
 * See https://github.com/tootsuite/documentation/blob/master/Using-the-API/API.md#account
 * 
 * @typedef {Object} AccountMetadata
 * @prop {String} name
 * @prop {String} value
 */



/**
 * See https://github.com/tootsuite/documentation/blob/master/Using-the-API/API.md#status
 * 
 * @typedef {Object} Statusable
 * @prop {Number} id
 * @prop {String} uri
 * @prop {String} url
 * @prop {Accountable} account
 * @prop {Number | null} [in_reply_to_id]
 * @prop {Number | null} [in_reply_to_account_id]
 * @prop {Statusable | null} reblog
 * @prop {String} content
 * @prop {Number} created_at
 * @prop {Array<Emoji>} emojis
 * @prop {Number} reblogs_count
 * @prop {Number} favourites_count
 * @prop {Boolean} reblogged
 * @prop {Boolean} favourited
 * @prop {Boolean} muted
 * @prop {Boolean} sensitive
 * @prop {String} spoiler_text
 * @prop {"public" | "unlisted" | "private" | "direct" | String} visibility
 * @prop {Array<Attachment>} media_attachments
 * @prop {Array<Mention>} mentions
 * @prop {Array<Tag>} tags
 * @prop {Application} application
 * @prop {String} language
 * @prop {Boolean | null} [pinned]
 */



/**
 * See https://github.com/tootsuite/documentation/blob/master/Using-the-API/API.md#notification
 * 
 * @typedef {Object} Notifirable
 * @prop {Number} id
 * @prop {"mention" | "reblog" | "favourite" | "follow"} type
 * @prop {Number} created_at
 * @prop {Accountable} account
 * @prop {Statusable | null} [status]
 */



/**
 * See https://github.com/tootsuite/documentation/blob/master/Using-the-API/Streaming-API.md#stream-contents
 * 
 * @typedef {Object} Stream
 * @prop {"update" | "notification" | "delete"} event
 * @prop {Statusable | Notifirable | Number} data
 */



/**
 * See https://github.com/tootsuite/documentation/blob/master/Using-the-API/API.md#emoji
 * 
 * @typedef {Object} Emoji
 * @prop {String} shortcode
 * @prop {String} static_url
 * @prop {String} url
 */



/**
 * https://github.com/tootsuite/documentation/blob/master/Using-the-API/API.md#attachment
 * 
 * @typedef {Object} Attachment
 * @prop {Number} id
 * @prop {"image" | "video" | "gifv" | "unknown"} type
 * @prop {String} url
 * @prop {String | null} [remote_url]
 * @prop {String} preview_url
 * @prop {String | null} [text_url]
 * @prop {AttachmentMetadata | null} [meta]
 * @prop {String | null} [description]
 */



/**
 * See https://github.com/tootsuite/documentation/blob/master/Using-the-API/API.md#mention
 * 
 * @typedef {Object} Mention
 * @prop {String} url
 * @prop {String} username
 * @prop {String} acct
 * @prop {Number} id
 */



/**
 * See https://github.com/tootsuite/documentation/blob/master/Using-the-API/API.md#tag
 * 
 * @typedef {Object} Tag
 * @prop {String} name
 * @prop {String} url
 * @prop {Array<TagHistory>} history
 */

/**
 * See https://github.com/tootsuite/documentation/blob/master/Using-the-API/API.md#tag
 * 
 * @typedef {Object} TagHistory
 * @prop {Number} day
 * @prop {Number} uses
 * @prop {Number} accounts
 */



/**
 * See https://github.com/tootsuite/documentation/blob/master/Using-the-API/API.md#application
 * 
 * @typedef {Object} Application
 * @prop {String} name
 * @prop {String | null} [website]
 */



module.exports = {};