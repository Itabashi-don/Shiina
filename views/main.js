const tokenizeContent = document.getElementById("tokenize-content");
const tokenizeApply = document.getElementById("tokenize-apply");
const logType = document.getElementById("log-type");
const logApply = document.getElementById("log-apply");
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
	sample (word) {
		let words = this.data[word];
		if (words === undefined) words = [];

		return words[Math.floor(Math.random() * words.length)];
	}

	//マルコフ連鎖でつなげた文を返す
	make () {
		let sentence = [];
		let word = this.sample(null);

		while (word) {
			sentence.push(word);
			word = this.sample(word);
		}

		return sentence.join("");
	}
}



const markov = new Markov();

window.addEventListener("DOMContentLoaded", () => {
	tokenizeApply.addEventListener("click", () => {
		fetch(`/tokenize?content=${tokenizeContent.value}`).then(res => res.json()).then(tokenized => {
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