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
 * @extends ArgumentError
 * @author Genbu Hase
 */
class ArgumentNotAcceptableError extends ArgumentError {
	/**
	 * ArgumentNotAcceptableErrorを生成します
	 * 
	 * @param {String} argName 引数名
	 * @param {Number} [argIndex] 引数のインデックス
	 * @param {String | Array<String>} [acceptables] 許容される引数型名
	 */
	constructor (argName, argIndex, acceptables) {
		if (!acceptables) {
			super(argName, argIndex, "is not acceptable");
		} else {
			//must be String
			//must be String, Number, or Array

			if (!Array.isArray(acceptables) || (Array.isArray(acceptables) && acceptables.length === 1)) {
				super(argName, argIndex, `must be ${acceptables}`);
			} else {
				let listed = "";
				acceptables.forEach((acceptable, index) => {
					if (index === acceptables.length - 1) return listed += `or ${acceptable}`;

					return listed += `${acceptable}, `;
				});

				super(argName, argIndex, `must be ${listed}`);
			}
		}
	}

	get name () { return "ArgumentNotAcceptableError" }
}

/**
 * 引数の定義が必須である事を示します
 * 
 * @extends ArgumentError
 * @author Genbu Hase
 */
class ArgumentNotDefinedError extends ArgumentError {
	/**
	 * ArgumentNotDefinedErrorを生成します
	 * 
	 * @param {String} argName 引数名
	 * @param {Number} [argIndex] 引数のインデックス
	 */
	constructor (argName, argIndex) { super(argName, argIndex, "is required") }

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
 * @extends EnvironmentError
 * @author Genbu Hase
 */
class EnvironmentNotDefinedError extends EnvironmentError {
	/**
	 * EnvironmentNotDefinedErrorを生成します
	 * 
	 * @param {String} envName 環境変数名
	 * @param {Number} [envIndex] 環境変数のインデックス
	 */
	constructor (envName) { super(envName, "is required") }

	get name () { return "EnvironmentNotDefinedError" }
}



module.exports = {
	ArgumentError,
	ArgumentNotAcceptableError,
	ArgumentNotDefinedError,

	EnvironmentError,
	EnvironmentNotDefinedError
};