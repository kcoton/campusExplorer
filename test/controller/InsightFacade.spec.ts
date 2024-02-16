import {
	IInsightFacade,
	InsightDatasetKind,
	InsightError,
	NotFoundError
} from "../../src/controller/IInsightFacade";
import InsightFacade from "../../src/controller/InsightFacade";

import {assert, expect, use} from "chai";
import chaiAsPromised from "chai-as-promised";
import {clearDisk, getContentFromArchives, readFileQueries} from "../TestUtil";

use(chaiAsPromised);

export interface ITestQuery {
	title: string;
	input: unknown;
	errorExpected: boolean;
	expected: any;
}

describe("InsightFacade", function () {
	let facade: IInsightFacade;

	// Declare datasets used in tests. You should add more datasets like this!
	let sections: string;

	before(async function () {
		// This block runs once and loads the datasets.
		sections = await getContentFromArchives("pair.zip");

		// Just in case there is anything hanging around from a previous run of the test suite
		await clearDisk();
	});

	describe("AddDataset", function () {

		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			facade = new InsightFacade();
		});

		afterEach(async function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent of the previous one
			await clearDisk();
		});

		it("should reject with  an empty dataset id", async function () {
			const result = facade.addDataset("", sections, InsightDatasetKind.Sections);

			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});
	});

	// Adding tests for addDataset from C0
	describe ("Testing the add API of InsightFacade", () => {
		let insightFacade: InsightFacade;
		let content0: string;
		let content1: string;
		const sectionsType = InsightDatasetKind.Sections;

		before(async () => {
			content0 = await getContentFromArchives("courses0.zip");
			content1 = await getContentFromArchives("courses1.zip");
		});

		beforeEach (async () => {
			await clearDisk();
			insightFacade = new InsightFacade();
		});

		it ("addDataset: add success, one valid dataset", () => {
			const addId = "courses0";
			const res = insightFacade.addDataset(addId, content0, sectionsType);
			return expect(res).to.eventually.have.members([addId]);
		});

		it ("addDataset: reject if id contains underscore", () => {
			const res = insightFacade.addDataset("courses_0", content0, sectionsType);
			return expect(res).to.eventually.be.rejectedWith(InsightError);
		});

		it ("addDataset: should reject if id contains only white space", () => {
			const res = insightFacade.addDataset(" ", content0, sectionsType);
			return expect(res).to.eventually.be.rejectedWith(InsightError);
		});

		it ("addDataset: reject if id is empty", () => {
			const res = insightFacade.addDataset("", content0, sectionsType);
			return expect(res).to.eventually.be.rejectedWith(InsightError);
		});

		it ("addDataset: reject if encounter same id again", async () => {
			try {
				await insightFacade.addDataset("courses0", content0, sectionsType);
			} catch (err) {
				assert.fail("Should not reject");
			}
			const res = insightFacade.addDataset("courses0", content1, sectionsType);
			return expect(res).to.eventually.be.rejectedWith(InsightError);
		});

	});

	// Adding tests for removeDataset from c0
	describe("remove api", function() {
		let insightFacade: InsightFacade;
		let content0: string;
		let content1: string;
		const sectionsType = InsightDatasetKind.Sections;

		before(async () => {
			content0 = await getContentFromArchives("courses0.zip");
			content1 = await getContentFromArchives("courses1.zip");
		});

		beforeEach (async () => {
			insightFacade = new InsightFacade();

			await insightFacade.addDataset("courses0", content0, sectionsType);
			await insightFacade.addDataset("courses1", content1, sectionsType);
		});

		this.afterEach(async () => {
			await clearDisk();
		});

		it ("removeDataset: remove 1 id success", async () => {
			const res =  await insightFacade.removeDataset("courses0");
			return expect(res).to.equal("courses0");
		});

		it ("removeDataset: remove unavailable id, rejected", () => {
			const res =  insightFacade.removeDataset("coursesNA");
			return expect(res).to.eventually.be.rejectedWith(NotFoundError);
		});

		it ("removeDataset: invalid id underscore", () => {
			const res =  insightFacade.removeDataset("courses_0");
			return expect(res).to.eventually.be.rejectedWith(InsightError);
		});
		it ("removeDataset: invalid id with only white space", () => {
			const res = insightFacade.removeDataset("  ");
			return expect(res).to.eventually.be.rejectedWith(InsightError);
		});
		it ("removeDataset: invalid id empty", () => {
			const res =  insightFacade.removeDataset("");
			return expect(res).to.eventually.be.rejectedWith(InsightError);
		});
	});

	// Add tests for listDataset
	describe ("list api", function() {
		let insightFacade: InsightFacade;
		let content0: string;
		let content1: string;
		const sectionsType = InsightDatasetKind.Sections;

		before(async () => {
			content0 = await getContentFromArchives("courses0.zip");
			content1 = await getContentFromArchives("courses1.zip");
		});

		beforeEach (async () => {
			await clearDisk();
			insightFacade = new InsightFacade();
			await insightFacade.addDataset("courses0", content0, sectionsType);
		});

		// Tests for listDatasets
		it ("listDatasets: add 1, list 1, remove 0", async () => {
			// await insightFacade.addDataset('courses0', content0, sections)
			const result = await insightFacade.listDatasets();
			expect(result).to.have.length(1);
			expect(result[0].id).to.equal("courses0");
			expect(result[0].kind).to.deep.equal(sectionsType);
			expect(result[0].numRows).to.deep.equal(4);
		});

		it ("listDatasets: add 2, remove none, and then remove 1", async () => {
			await insightFacade.addDataset("courses1", content1, sectionsType);
			const result = await insightFacade.listDatasets();
			expect(result).to.have.length(2);
			expect(result[0].id).to.equal("courses0");
			expect(result[0].kind).to.deep.equal(sectionsType);
			expect(result[1].id).to.equal("courses1");
			expect(result[1].kind).to.deep.equal(sectionsType);
			expect(result[1].numRows).to.deep.equal(2);

			// remove 1, expect 1
			await insightFacade.removeDataset("courses1");
			const result2 = await insightFacade.listDatasets();
			expect(result2).to.have.length(1);
			expect(result2[0].id).to.equal("courses0");
			expect(result2[0].kind).to.deep.equal(sectionsType);

			// remove 1, expect 0
			await insightFacade.removeDataset("courses0");
			const result3 = await insightFacade.listDatasets();
			expect(result3).to.have.length(0);
		});
	});


	// /*
	//  * This test suite dynamically generates tests from the JSON files in test/resources/queries.
	//  * You can and should still make tests the normal way, this is just a convenient tool for a majority of queries.
	//  */
	describe("PerformQuery", function () {
		before(async function () {
			facade = new InsightFacade();

			// Add the datasets to InsightFacade once.
			// Will *fail* if there is a problem reading ANY dataset.
			const loadDatasetPromises = [
				facade.addDataset("sections", sections, InsightDatasetKind.Sections),
			];

			try {
				await Promise.all(loadDatasetPromises);
			} catch(err) {
				throw new Error(`In PerformQuery Before hook, dataset(s) failed to be added. \n${err}`);
			}
		});

		after(async function () {
			await clearDisk();
		});

		describe("valid queries", function() {
			let validQueries: ITestQuery[];
			try {
				validQueries = readFileQueries("valid");
			} catch (e: unknown) {
				expect.fail(`Failed to read one or more test queries. ${e}`);
			}

			validQueries.forEach(function(test: any) {
				it(`${test.title}`, async function () {
					if (test.errorExpected) {
						try {
							await facade.performQuery(test.input);
							assert.fail("performQuery: expected an error but none was thrown");
						} catch(e) {
							// expected error
							console.log(`performQuery: expected error: ${e}`);
						}
					} else {
						try {
							const result = await facade.performQuery(test.input);
							// console.log(result); // print results

							expect(result).to.deep.equal(test.expected);
						} catch(e) {
							assert.fail(`performQuery: threw an unexpected error: ${e}`);
						}
					}
				});
			});
		});

		describe("invalid queries", function() {
			let invalidQueries: ITestQuery[];

			try {
				invalidQueries = readFileQueries("invalid");
			} catch (e: unknown) {
				expect.fail(`Failed to read one or more test queries. ${e}`);
			}

			invalidQueries.forEach(function(test: any) {
				it(`${test.title}`, function () {
					return facade.performQuery(test.input).then((result) => {
						assert.fail(`performQuery resolved when it should have rejected with ${test.expected}`);
					}).catch((err: any) => {
						if (test.expected === "InsightError") {
							expect(err).to.be.instanceOf(InsightError);
						} else {
							assert.fail("Query threw unexpected error");
						}
					});
				});
			});
		});
	});
});
