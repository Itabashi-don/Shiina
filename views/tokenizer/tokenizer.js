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

			while (resultList.rows.length) resultList.deleteRow(0);

			for (const token of tokenized) {
				const tokenRow = resultList.insertRow();

				for (let i = 0; i < featureTypes.length; i++) tokenRow.insertCell(i);
				for (const featureName in token) tokenRow.cells[featureTypes.findIndex(name => name === featureName)].textContent = token[featureName];
			}
		});
	});

	clearBtn.addEventListener("click", () => {
		textInputter.value = "";
		M.updateTextFields();
	});
});