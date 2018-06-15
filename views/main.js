const tokenizeText = document.getElementById("tokenize-text");
const tokenizeApply = document.getElementById("tokenize-apply");
const importName = document.getElementById("import-name");
const importApply = document.getElementById("import-apply");
const generatorAmount = document.getElementById("generator-amount");
const generatorApply = document.getElementById("generator-apply");



class Generator {
	constructor () {
		/** @type {Dictionary} */
		this.dictionary = new Dictionary();
		/** @type {Object<string, Kuromoji.IpadicFeatures[]>} */
		this.wordSet = {};
		/** @type {String[][]} */
		this.structureSet = [];
	}

	/**
	 * データの登録を行います
	 * @param {Kuromoji.IpadicFeatures[]} tokenized
	 */
	register (tokenized) {
		const { dictionary, wordSet, structureSet } = this;

		Array.prototype.push.apply(dictionary, tokenized);
		structureSet.push(tokenized.map(word => word.pos));

		tokenized.forEach((word, index, parent) => {
			const nowWord = word;
			const prevForm = parent[index - 1] ? parent[index - 1].surface_form : "";

			if (!nowWord) return;

			if (!wordSet[prevForm]) wordSet[prevForm] = [];
			wordSet[prevForm].push(nowWord);
		});
	}

	/**
	 * 次に続く文字を返します
	 * 
	 * @param {String} [word=""]
	 * @param {String | null} [structure=null]
	 * 
	 * @return {Kuromoji.IpadicFeatures}
	 */
	next (word = "", structure = null) {
		const { dictionary, wordSet } = this;

		if (!wordSet[word]) return;

		const words = wordSet[word];
		const structures = words.map(word => word.pos);
		const currentStructure = structures[Math.floor(Math.random() * structures.length)];

		if (!word) {
			const matchedWords = dictionary.orderByStructure(structure || currentStructure);
			return matchedWords[Math.floor(Math.random() * matchedWords.length)];
		}
		
		const matchedWords = words.filter(word => word.pos === (structure || currentStructure));
		return matchedWords[Math.floor(Math.random() * matchedWords.length)];
	}

	/**
	 * 文章を合成します
	 * 
	 * @param {String} [word=""]
	 * @param {Boolean} [isAdvanced=false]
	 * 
	 * @return {String}
	 */
	generate (word = "", isAdvanced = false) {
		const { structureSet } = this;
		
		const content = [ word ];
		const structures = structureSet[Math.floor(Math.random() * structureSet.length)];

		let next = word;
		let counter = 0;
		while ((next = this.next(next, isAdvanced ? structures[counter] : null))) {
			next = next.surface_form;
			counter++;

			if (content.length >= 200) break;
			content.push(next);
		}

		return content.join("");
	}
}

/**
 * @class Dictionary @extends Array
 */
class Dictionary extends Array {
	constructor () {
		super();
	}

	/**
	 * 指定された品詞の単語を返します
	 * 
	 * @param {String} type
	 * @return {Kuromoji.IpadicFeatures[]}
	 */
	orderByStructure (type) {
		if (!type) throw new StructureError(type);

		return this.filter(word => word.pos === type);
	}
}

/**
 * @class StructureError @extends TypeError
 */
class StructureError extends TypeError {
	/**
	 * 品詞に関するエラーを生成します
	 * @param {String} type
	 */
	constructor (type) {
		super(`A structure type, "${type ? type : ""}" is not acceptable`);
	}
}



const generator = new Generator();

window.addEventListener("DOMContentLoaded", () => {
	fetch("/samples").then(res => res.json()).then(files => {
		for (let file of files) importName.add(new Option(file, file));
	});
});

window.addEventListener("DOMContentLoaded", () => {
	tokenizeApply.addEventListener("click", () => {
		fetch(`/tokenize?text=${tokenizeText.value}&mode=long`).then(res => res.json()).then(tokenized => {
			console.log(tokenized);
			
			for (let sentence of tokenized) {
				generator.register(sentence);
			}
		});
	});

	importApply.addEventListener("click", () => {
		fetch(`/sample?name=${importName.value}`).then(res => res.json()).then(text => {
			for (let line of text) {
				fetch(`/tokenize?text=${line}&mode=long`).then(res => res.json()).then(tokenized => {
					console.log(tokenized);
					
					for (let sentence of tokenized) {
						generator.register(sentence);
					}
				});
			}
		});
	});

	generatorApply.addEventListener("click", () => {
		fetch(`/log?type=dialogue`).then(res => res.json()).then(log => {
			console.log(log);
			
			for (let tokenized of log) {
				generator.register(tokenized);
			}

			for (let i = 0; i < generatorAmount.value; i++) console.log(generator.generate());
		});
	});
});