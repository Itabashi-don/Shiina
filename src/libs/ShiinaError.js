/**
 * プロパティに関するエラー
 * 
 * @extends TypeError
 * @author Genbu Hase
 */
class PropertyError extends TypeError {
	/**
	 * ラベル定義(single: 単数形, multi: 複数形)
	 * @return {{ single: String, multi: String }}
	 */
	static get Label () { return { single: "Property", multi: "Properties" } }



	/**
	 * PropertyErrorを生成します
	 * 
	 * @param {String} propName プロパティ名
	 * @param {Number} [propIndex] プロパティのインデックス
	 * @param {String} [description=""] エラー文(ex: "<'TEST' | 1st Property> "に繋がります)
	 * @param {PropertyError.Label} [label=PropertyError.Label] プロパティのラベル定義
	 */
	constructor (propName, propIndex, description = "", label = PropertyError.Label) {
		if (propIndex) {
			!propIndex ?
				propIndex = `One of ${label.multi}` :
			propIndex == 1 ?
				propIndex += "st" :
			propIndex == 2 ?
				propIndex += "nd" :
			propIndex == 3 ?
				propIndex += "rd" :
			propIndex += "th";

			super(`<'${propName}' | ${propIndex} ${label.single}> ${description}`);
		} else {
			super(`'${propName}' ${description}`);
		}
	}

	get name () { return "PropertyError" }
}

/**
 * 許容されないプロパティ型である事を示します
 * 
 * @extends PropertyError
 * @author Genbu Hase
 */
class PropertyNotAcceptableError extends PropertyError {
	/**
	 * PropertyNotAcceptableErrorを生成します
	 * 
	 * @param {String} propName プロパティ名
	 * @param {Number} [propIndex] プロパティのインデックス
	 * @param {String | Array<String>} [acceptables] 許容されるプロパティ型名
	 * @param {PropertyError.Label} [label=PropertyError.Label] プロパティのラベル定義
	 */
	constructor (propName, propIndex, acceptables, label = PropertyError.Label) {
		if (!acceptables) {
			super(propName, propIndex, "is not acceptable", label);
		} else {
			if (!Array.isArray(acceptables) || (Array.isArray(acceptables) && acceptables.length === 1)) {
				super(propName, propIndex, `must be ${acceptables}`, label);
			} else {
				let listed = "";
				acceptables.forEach((acceptable, index) => {
					if (index === acceptables.length - 1) return listed += `or ${acceptable}`;

					return listed += `${acceptable}, `;
				});

				super(propName, propIndex, `must be ${listed}`, label);
			}
		}
	}

	get name () { return "PropertyNotAcceptableError" }
}

/**
 * プロパティの定義が必須である事を示します
 * 
 * @extends PropertyError
 * @author Genbu Hase
 */
class PropertyNotDefinedError extends PropertyError {
	/**
	 * PropertyNotDefinedErrorを生成します
	 * 
	 * @param {String} propName プロパティ名
	 * @param {Number} [propIndex] プロパティのインデックス
	 * @param {PropertyError.Label} [label=PropertyError.Label] プロパティのラベル定義
	 */
	constructor (propName, propIndex, label = PropertyError.Label) { super(propName, propIndex, "is required", label) }

	get name () { return "PropertyNotDefinedError" }
}



/**
 * 引数に関するエラー
 * 
 * @extends PropertyError
 * @author Genbu Hase
 */
class ArgumentError extends PropertyError {
	static get Label () { return { single: "Argument", multi: "Arguments" } }



	/**
	 * ArgumentErrorを生成します
	 * 
	 * @param {String} argName 引数名
	 * @param {Number} [argIndex] 引数のインデックス
	 * @param {String} [description=""] エラー文(ex: "<'TEST' | 1st Argument> "に繋がります)
	 */
	constructor (argName, argIndex, description = "") { super(argName, argIndex, description, ArgumentError.Label) }

	get name () { return "ArgumentError" }
}

/**
 * 許容されない引数型である事を示します
 * 
 * @extends PropertyNotAcceptableError
 * @author Genbu Hase
 */
class ArgumentNotAcceptableError extends PropertyNotAcceptableError {
	/**
	 * ArgumentNotAcceptableErrorを生成します
	 * 
	 * @param {String} argName 引数名
	 * @param {Number} [argIndex] 引数のインデックス
	 * @param {String | Array<String>} [acceptables] 許容される引数型名
	 */
	constructor (argName, argIndex, acceptables) { super(argName, argIndex, acceptables, ArgumentError.Label) }

	get name () { return "ArgumentNotAcceptableError" }
}

/**
 * 引数の定義が必須である事を示します
 * 
 * @extends PropertyNotDefinedError
 * @author Genbu Hase
 */
class ArgumentNotDefinedError extends PropertyNotDefinedError {
	/**
	 * ArgumentNotDefinedErrorを生成します
	 * 
	 * @param {String} argName 引数名
	 * @param {Number} [argIndex] 引数のインデックス
	 */
	constructor (argName, argIndex) { super(argName, argIndex, ArgumentError.Label) }

	get name () { return "ArgumentNotDefinedError" }
}



/**
 * 環境変数に関するエラー
 * 
 * @extends PropertyError
 * @author Genbu Hase
 */
class EnvironmentError extends PropertyError {
	static get Label () { return { single: "Environment", multi: "Environments" } }



	/**
	 * EnvironmentErrorを生成します
	 * 
	 * @param {String} envName 環境変数名
	 * @param {String} [description=""] エラー文(ex: "<'TEST' | One of Environments> "に繋がります)
	 */
	constructor (envName, description = "") { super(envName, null, description, EnvironmentError.Label) }

	get name () { return "EnvironmentError" }
}

/**
 * 環境変数の定義が必須である事を示します
 * 
 * @extends PropertyNotDefinedError
 * @author Genbu Hase
 */
class EnvironmentNotDefinedError extends PropertyNotDefinedError {
	/**
	 * EnvironmentNotDefinedErrorを生成します
	 * @param {String} envName 環境変数名
	 */
	constructor (envName) { super(envName, null, EnvironmentError.Label) }

	get name () { return "EnvironmentNotDefinedError" }
}



/**
 * APIのペイロードに関するエラー
 * 
 * @extends PropertyError
 * @author Genbu Hase
 */
class PayloadError extends PropertyError {
	static get Label () { return { single: "Payload", multi: "Payloads" } }



	/**
	 * PayloadErrorを生成します
	 * 
	 * @param {String} payloadName ペイロード名
	 * @param {String} [description=""] エラー文(ex: "<'TEST' | One of Payloads> "に繋がります)
	 */
	constructor (payloadName, description = "") { super(payloadName, null, description, PayloadError.Label) }

	get name () { return "PayloadError" }
}

/**
 * 許容されないペイロード型である事を示します
 * 
 * @extends PropertyNotAcceptableError
 * @author Genbu Hase
 */
class PayloadNotAcceptableError extends PropertyNotAcceptableError {
	/**
	 * PayloadNotAcceptableErrorを生成します
	 * 
	 * @param {String} payloadName ペイロード名
	 * @param {String | Array<String>} [acceptables] 許容されるペイロード型名
	 */
	constructor (payloadName, acceptables) { super(payloadName, null, acceptables, PayloadError.Label) }

	get name () { return "PayloadNotAcceptableError" }
}

/**
 * ペイロードが必須である事を示します
 * 
 * @extends PropertyNotDefinedError
 * @author Genbu Hase
 */
class PayloadNotDefinedError extends PropertyNotDefinedError {
	/**
	 * PayloadNotDefinedErrorを生成します
	 * @param {String} payloadName ペイロード名
	 */
	constructor (payloadName) { super(payloadName, null, PayloadError.Label) }

	get name () { return "PayloadNotDefinedError" }
}



module.exports = {
	ArgumentError,
	ArgumentNotAcceptableError,
	ArgumentNotDefinedError,

	EnvironmentError,
	EnvironmentNotDefinedError,

	PayloadError,
	PayloadNotAcceptableError,
	PayloadNotDefinedError
};