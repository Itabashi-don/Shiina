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
	textInputter.addEventListener("keydown", event => {
		if (event.ctrlKey && event.keyCode === 13) tokenizeBtn.click();
	});

	tokenizeBtn.addEventListener("click", () => {
		fetch("/tokenize", {
			method: "POST",
			headers: { "Content-Type": "application/json" },

			body: JSON.stringify({ text: textInputter.value })
		}).then(res => res.json()).then(
			/** @param {Array<Object<string, string | number>>} tokenized */
			tokenized => {
				console.log(tokenized);

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

				return Promise.resolve(tokenized);
			}
		).then(tokenized => {
			const words = tokenized.map(token => token.surface_form);
			const structures = tokenized.map(token => [ token.pos, token.pos_detail_1, token.pos_detail_2, token.pos_detail_3 ]);

			let sequenceCount = 0;
			structures.forEach((structure, index) => {
				switch (true) {
					case structure[0] === "名詞":
					case structure[0] === "記号" && structure[1] === "空白" && structures[index - 1] && structures[index - 1][1] !== "固有名詞":
						switch (true) {
							case 0 < sequenceCount && structure[1] === "接尾" && structures[index + 1] && structures[index + 1][1] !== "接尾":
							case 0 < sequenceCount && index === structures.length - 1:
								M.toast({
									classes: "orange darken-2",
									html: `【新出固有名詞】${words.slice(index - sequenceCount, index + 1).join("")}`
								});

								return sequenceCount = 0;
						}

						return sequenceCount++;

					default:
						switch (true) {
							case 1 < sequenceCount:
								M.toast({
									classes: "blue",
									html: `【新出固有名詞】${words.slice(index - sequenceCount, index).join("")}`
								});
								
								break;
						}

						return sequenceCount = 0;
				}
			});
		})
	});

	clearBtn.addEventListener("click", () => {
		textInputter.value = "";
		M.updateTextFields();
	});
});