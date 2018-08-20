/** @type {HTMLTextAreaElement} */
const textInputter = document.getElementById("tokenizer-text");
/** @type {HTMLButtonElement} */
const tokenizeBtn = document.getElementById("tokenizer-tokenize");
/** @type {HTMLButtonElement} */
const clearBtn = document.getElementById("tokenizer-clear");
/** @type {HTMLTableElement} */
const resultTable = document.getElementById("tokenizer-result");
/** @type {HTMLTableSectionElement} */
const resultList = resultTable.querySelector("TBody");



const featureTypes = [
	"word_id",
	"word_type",
	"word_position",
	"surface_form",
	"pos",
	"pos_detail_1",
	"pos_detail_2",
	"pos_detail_3",
	"conjugated_type",
	"conjugated_form",
	"basic_form",
	"reading",
	"pronunciation",
	"feeling"
];

const tokenizeBtn_handleClick = isMultiLine => {
	fetch("/api/tokenize", {
		method: "POST",
		headers: { "Content-Type": "application/json" },

		body: JSON.stringify({ text: textInputter.value, isMultiLine })
	}).then(res => res.json()).then(
		/** @param {Array<Object<string, string | number>>} tokenized */
		tokenizeInfo => {
			console.log(tokenizeInfo);

			const { tokenized = [], tokenizedCollection, propers } = tokenizeInfo;

			if (tokenizedCollection) {
				for (const sentence of tokenizedCollection) tokenized.push(...sentence);
			}

			while (resultList.rows.length) resultList.deleteRow(0);
			for (const token of tokenized) {
				const tokenRow = resultList.insertRow();

				for (let i = 0; i < featureTypes.length; i++) tokenRow.insertCell(i);
				for (const featureName in token) tokenRow.cells[featureTypes.findIndex(name => name === featureName)].textContent = token[featureName];
			}
			
			const feelingSum = tokenized.map(token => token.feeling).reduce((prev, current) => prev + current);
			const feelingSumRow = resultList.insertRow();

			for (let i = 0; i < featureTypes.length; i++) feelingSumRow.insertCell(i);
			feelingSumRow.cells[featureTypes.findIndex(name => name === "feeling")].textContent = feelingSum;

			return Promise.resolve(propers);
		}
	).then(propers => {
		const classes = ["orange darken-2", "blue"];

		for (const proper of propers) {
			M.toast({
				classes: classes[proper.type - 1],
				html: `【固有名詞】${proper.word}`
			});
		}
	});
};



window.addEventListener("DOMContentLoaded", () => {
	textInputter.addEventListener("keydown", event => {
		if (event.ctrlKey && event.keyCode === 13) tokenizeBtn_handleClick(event.shiftKey);
	});

	tokenizeBtn.addEventListener("click", () => tokenizeBtn_handleClick());

	clearBtn.addEventListener("click", () => {
		textInputter.value = "";
		M.updateTextFields();
	});
});



/* global M */