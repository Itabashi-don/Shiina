/** @type {HTMLTextAreaElement} */
const textInputter = document.getElementById("tokenizer-text");
/** @type {HTMLButtonElement} */
const tokenizeBtn = document.getElementById("tokenizer-tokenize");
/** @type {HTMLTableElement} */
const resultTable = document.getElementById("tokenizer-result");



window.addEventListener("DOMContentLoaded", () => {
	tokenizeBtn.addEventListener("click", () => {
		fetch("/tokenize", {
			method: "POST",
			headers: { "Content-Type": "application/json" },

			body: JSON.stringify({
				text: textInputter.value
			})
		}).then(res => res.json()).then(tokenized => {
			console.log(tokenized);

			//resultTable.tbodies.insertRow()
		});
	});
});