const fs = require("fs");
const gulp = require("gulp");
const gulpGzip = require("gulp-gzip");
const del = require("del");
const sequence = require("run-sequence");
const IPADic = require("mecab-ipadic-seed");
const kuromoji = require("kuromoji");
const Logger = require("./src/libs/Logger");



gulp.task("clean-dict", done => del([ "dict/*.gz" ], done));

gulp.task("create-dat-files", done => {
	if (!fs.existsSync("dict/")) fs.mkdirSync("dict/");

	/**
	 * Convert to buffer
	 * @param {Buffer} typed
	 */
	const toBuffer = typed => {
		const ab = typed.buffer;
		const buffer = new Buffer(ab.byteLength);
		const view = new Uint8Array(ab);
		for (let i = 0; i < buffer.length; ++i) {
			buffer[i] = view[i];
		}
		return buffer;
	}

	const dic = new IPADic();
	const builder = kuromoji.dictionaryBuilder();

	const userDic = new Logger.CsvLogger("dict/userDic.csv", "Shift-JIS");
	userDic.on("initialized").then(userDic => {
		// Build token info dictionary
		const tokenInfoPromise = dic.readTokenInfo(line => builder.addTokenInfoDictionary(line)).then(() => {
			if (userDic.length) {
				for (const token of userDic.log) {
					const {
						surface_form,
						left_id,
						right_id,
						word_cost,
						pos,
						pos_detail_1,
						pos_detail_2,
						pos_detail_3,
						conjugated_type,
						conjugated_form,
						basic_form,
						reading,
						pronunciation
					} = token;

					builder.addTokenInfoDictionary([ surface_form, left_id, right_id, word_cost, pos, pos_detail_1, pos_detail_2, pos_detail_3, conjugated_type, conjugated_form, basic_form, reading, pronunciation ].join(","));
				}
			}

			userDic.close();
			console.log("Finished reading token info dics");
		});

		// Build connection costs matrix
		const matrixDefPromise = dic.readMatrixDef(line => builder.putCostMatrixLine(line)).then(() => console.log("Finished reading matrix.def"));
		// Build unknown dictionary
		const unkDefPromise = dic.readUnkDef(line => builder.putUnkDefLine(line)).then(() => console.log("Finished reading unk.def"));
		// Build character definition dictionary
		const charDefPromise = dic.readCharDef(line => builder.putCharDefLine(line)).then(() => console.log("Finished reading char.def"));

		// Build kuromoji.js binary dictionary
		return Promise.all([ tokenInfoPromise, matrixDefPromise, unkDefPromise, charDefPromise ]).then(() => {
			console.log("Finished reading all seed dictionary files");
			console.log("Building binary dictionary ...");

			return builder.build();
		});
	}).then(dic => {
		const base_buffer = toBuffer(dic.trie.bc.getBaseBuffer());
		const check_buffer = toBuffer(dic.trie.bc.getCheckBuffer());
		const token_info_buffer = toBuffer(dic.token_info_dictionary.dictionary.buffer);
		const tid_pos_buffer = toBuffer(dic.token_info_dictionary.pos_buffer.buffer);
		const tid_map_buffer = toBuffer(dic.token_info_dictionary.targetMapToBuffer());
		const connection_costs_buffer = toBuffer(dic.connection_costs.buffer);
		const unk_buffer = toBuffer(dic.unknown_dictionary.dictionary.buffer);
		const unk_pos_buffer = toBuffer(dic.unknown_dictionary.pos_buffer.buffer);
		const unk_map_buffer = toBuffer(dic.unknown_dictionary.targetMapToBuffer());
		const char_map_buffer = toBuffer(dic.unknown_dictionary.character_definition.character_category_map);
		const char_compat_map_buffer = toBuffer(dic.unknown_dictionary.character_definition.compatible_category_map);
		const invoke_definition_map_buffer = toBuffer(dic.unknown_dictionary.character_definition.invoke_definition_map.toBuffer());

		fs.writeFileSync("dict/base.dat", base_buffer);
		fs.writeFileSync("dict/check.dat", check_buffer);
		fs.writeFileSync("dict/tid.dat", token_info_buffer);
		fs.writeFileSync("dict/tid_pos.dat", tid_pos_buffer);
		fs.writeFileSync("dict/tid_map.dat", tid_map_buffer);
		fs.writeFileSync("dict/cc.dat", connection_costs_buffer);
		fs.writeFileSync("dict/unk.dat", unk_buffer);
		fs.writeFileSync("dict/unk_pos.dat", unk_pos_buffer);
		fs.writeFileSync("dict/unk_map.dat", unk_map_buffer);
		fs.writeFileSync("dict/unk_char.dat", char_map_buffer);
		fs.writeFileSync("dict/unk_compat.dat", char_compat_map_buffer);
		fs.writeFileSync("dict/unk_invoke.dat", invoke_definition_map_buffer);
		
		done();
	});
});

gulp.task("compress-dict", () => {
	return gulp.src("dict/*.dat")
		.pipe(gulpGzip())
		.pipe(gulp.dest("dict/"));
});

gulp.task("clean-dat-files", done => del([ "dict/*.dat" ], done));

gulp.task("build-dict", [ "clean-dict" ], () => {
	sequence("create-dat-files", "compress-dict", "clean-dat-files");
});