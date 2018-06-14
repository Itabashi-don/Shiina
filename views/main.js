const tokenizeContent = document.getElementById("tokenize-content");
const tokenizeApply = document.getElementById("tokenize-apply");
const logType = document.getElementById("log-type");
const logApply = document.getElementById("log-apply");
/** @type {HTMLSelectElement} */
const importName = document.getElementById("import-name");
const importApply = document.getElementById("import-apply");
const markovAmount = document.getElementById("markov-amount");
const markovApply = document.getElementById("markov-apply");



//Thanks to https://zeny.io/blog/2016/06/16/kuromoji-js/
class Markov {
	constructor () {
		this.data = {};
	}

	//データ登録
	add (words) {
		for (let i = 0; i <= words.length; i++) {
			let now = words[i];
			if (now === undefined) now = null;

			let prev = words[i - 1];
			if (prev === undefined) prev = null;

			if (this.data[prev] === undefined) this.data[prev] = [];

			this.data[prev].push(now);
		}
	}

	//指定された文字に続く文字をランダムに返す
	sample (word = null) {
		let words = this.data[word];
		if (words === undefined) words = [];

		return words[Math.floor(Math.random() * words.length)];
	}

	//マルコフ連鎖でつなげた文を返す
	make (content = null) {
		return fetch(`/tokenize?content=${content}`).then(res => res.json()).then(tokenized => {
			const mixed = [];
			for (let sentence of tokenized) Array.prototype.push.apply(mixed, sentence.map(word => word.surface_form));

			return mixed;
		}).then(sentence => {
			let word = this.sample(sentence[sentence.length - 1]);

			while (word) {
				sentence.push(word);
				word = this.sample(word);
			}

			return sentence.join("");
		});
	}
}

class Generator {
	constructor () {
		/** @type {Object<string, Kuromoji.IpadicFeatures[]>} */
		this.wordSet = {};
		/** @type {Object<string, Kuromoji.IpadicFeatures[]>} */
		this.structureSet = {};
	}

	/**
	 * データの登録を行います
	 * @param {Kuromoji.IpadicFeatures[]} tokenized
	 */
	register (tokenized) {
		tokenized.forEach((wordInfo, index, parent) => {
			const nowWord = wordInfo;
			const prevForm = parent[index - 1] ? parent[index - 1].surface_form : "";

			if (!nowWord) return;

			if (!this.wordSet[prevForm]) this.wordSet[prevForm] = [];
			if (!this.structureSet[nowWord.pos]) this.structureSet[nowWord.pos] = [];

			this.wordSet[prevForm].push(nowWord);
			this.structureSet[nowWord.pos].push(nowWord);
		});
	}

	/**
	 * 次に続く文字を返します
	 * 
	 * @param {String} word
	 * @return {Kuromoji.IpadicFeatures}
	 */
	next (word = "") {
		const words = this.wordSet[word];

		if (!words) return;

		const structures = words.map(word => word.pos);
		const currentStructure = structures[Math.floor(Math.random() * structures.length)];

		if (!word) {
			const matchedWords = this.structureSet[currentStructure];
			return matchedWords[Math.floor(Math.random() * matchedWords.length)];
		}

		const matchedWords = words.filter(word => word.pos === currentStructure);
		return matchedWords[Math.floor(Math.random() * matchedWords.length)];
	}

	/**
	 * 文章を合成します
	 * 
	 * @param {String} word
	 * @return {String}
	 */
	generate (word = "") {
		const content = [ word ];
		let next;

		while ((next = this.next(word))) {
			content.push(next.surface_form);
			word = next.surface_form;
		}

		return content.join("");
	}
}



const markov = new Markov();

window.addEventListener("DOMContentLoaded", () => {
	fetch("/samples").then(res => res.json()).then(files => {
		for (let file of files) importName.add(new Option(file, file));
	});
});

window.addEventListener("DOMContentLoaded", () => {
	tokenizeApply.addEventListener("click", () => {
		fetch(`/tokenize?text=${tokenizeContent.value}`).then(res => res.json()).then(tokenized => {
			console.log(tokenized);

			window.$t = tokenized;
		});
	});

	logApply.addEventListener("click", () => {
		fetch(`/log?type=${logType.value}`).then(res => res.json()).then(log => {
			console.log(log);

			window.$l = log;
		});
	});

	importApply.addEventListener("click", () => {
		fetch(`/sample?name=${importName.value}`).then(res => res.json()).then(lines => {
			for (let line of lines) {
				fetch(`/tokenize?content=${line}`).then(res => res.json()).then(morpheme => markov.add(morpheme.map(item => item.surface_form)));
			}
		});
	});

	markovApply.addEventListener("click", () => {
		fetch(`/log?type=whole`).then(res => res.json()).then(log => {
			console.log(log);

			for (let morpheme of log) {
				markov.add(morpheme.map(item => item.surface_form));
			}

			for (let i = 0; i < markovAmount.value; i++) console.log(markov.make());
		});
	});
});