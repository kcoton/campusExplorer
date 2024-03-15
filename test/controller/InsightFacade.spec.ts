import {
	IInsightFacade,
	InsightDatasetKind,
	InsightError,
	NotFoundError,
	InsightDataset
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
	let courses0: string;
	let courses1: string;

	before(async function () {
		// This block runs once and loads the datasets.
		sections = await getContentFromArchives("pair.zip");
		courses0 = await getContentFromArchives("courses0.zip");

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
	describe("Testing the add API of InsightFacade", () => {
		let insightFacade: InsightFacade;
		let content0: string;
		let content1: string;
		const sectionsType = InsightDatasetKind.Sections;
		let contentCampus: string;
		const roomsType = InsightDatasetKind.Rooms;
		let invalidTableContent: string;

		before(async () => {
			content0 = await getContentFromArchives("courses0.zip");
			content1 = await getContentFromArchives("courses1.zip");
			contentCampus = await getContentFromArchives("campus.zip");
			invalidTableContent = await getContentFromArchives("roomsNoTableIndex.zip");
		});

		beforeEach(async () => {
			await clearDisk();
			insightFacade = new InsightFacade();
		});

		it("addDataset: add success, one valid dataset sections", () => {
			const addId = "courses0";
			const res = insightFacade.addDataset(addId, content0, sectionsType);
			return expect(res).to.eventually.have.members([addId]);
		});

		it("addDataset: reject if id contains underscore", () => {
			const res = insightFacade.addDataset("courses_0", content0, sectionsType);
			return expect(res).to.eventually.be.rejectedWith(InsightError);
		});

		it("addDataset: reject if id contains underscore, rooms", () => {
			const res1 = insightFacade.addDataset("campus_", contentCampus, sectionsType);
			return expect(res1).to.eventually.be.rejectedWith(InsightError);
		});

		it("addDataset: should reject if id contains only white space", () => {
			const res = insightFacade.addDataset(" ", content0, sectionsType);
			return expect(res).to.eventually.be.rejectedWith(InsightError);
		});

		it("addDataset: reject if id is empty", () => {
			const res = insightFacade.addDataset("", content0, sectionsType);
			return expect(res).to.eventually.be.rejectedWith(InsightError);
		});

		it("addDataset: reject if encounter same id again", async () => {
			try {
				await insightFacade.addDataset("courses0", content0, sectionsType);
			} catch (err) {
				assert.fail("Should not reject");
			}
			const res = insightFacade.addDataset("courses0", content1, sectionsType);
			return expect(res).to.eventually.be.rejectedWith(InsightError);
		});

		it ("caching: new instance cannot add new id if it was added by old one", async () => {
			await insightFacade.addDataset("courses0", content0, sectionsType);

			const newInstance = new InsightFacade();
			const result = newInstance.addDataset("courses0", content0, sectionsType);
			return expect(result).to.be.eventually.rejectedWith(InsightError);
		});

		it ("caching: new instance cannot add new id if it was added by old one, rooms", async () => {
			await insightFacade.addDataset("campus", contentCampus, roomsType);

			const newInstance = new InsightFacade();
			const result = newInstance.addDataset("campus", contentCampus, roomsType);
			return expect(result).to.be.eventually.rejectedWith(InsightError);
		});

		it ("addRoomDataset: valid dataset success", async () => {
			const addId = "campus";
			const res = await insightFacade.addDataset(addId, contentCampus, roomsType);
			return expect(res).to.have.members([addId]);
		});

		it ("add both room and section: success", async () => {
			await insightFacade.addDataset("courses0", content0, sectionsType);
			const res = await insightFacade.addDataset("campus", contentCampus, roomsType);
			return expect(res).to.have.members(["courses0", "campus"]);
		});

		it ("cannot add when sections and rooms have same id", async () => {
			await insightFacade.addDataset("courses0", content0, sectionsType);
			const res = insightFacade.addDataset("courses0", contentCampus, roomsType);
			return expect(res).to.eventually.be.rejectedWith(InsightError);
		});

		it ("add invalidtableIndex reject", async () => {
			const res = insightFacade.addDataset("invalidTable", invalidTableContent, roomsType);
			return expect(res).to.eventually.be.rejectedWith(InsightError);
		});

	});

	// Adding tests for removeDataset from c0
	describe("remove api", function () {
		let insightFacade: InsightFacade;
		let content0: string;
		let content1: string;
		const sectionsType = InsightDatasetKind.Sections;

		before(async () => {
			content0 = await getContentFromArchives("courses0.zip");
			content1 = await getContentFromArchives("courses1.zip");
		});

		beforeEach(async () => {
			await clearDisk();
			insightFacade = new InsightFacade();

			await insightFacade.addDataset("courses0", content0, sectionsType);
			await insightFacade.addDataset("courses1", content1, sectionsType);
		});


		it("removeDataset: remove 1 id success", async () => {
			const res = await insightFacade.removeDataset("courses0");
			return expect(res).to.equal("courses0");
		});

		it("removeDataset: remove unavailable id, rejected", () => {
			const res = insightFacade.removeDataset("coursesNA");
			return expect(res).to.eventually.be.rejectedWith(NotFoundError);
		});

		it("removeDataset: invalid id underscore", () => {
			const res = insightFacade.removeDataset("courses_0");
			return expect(res).to.eventually.be.rejectedWith(InsightError);
		});
		it("removeDataset: invalid id with only white space", () => {
			const res = insightFacade.removeDataset("  ");
			return expect(res).to.eventually.be.rejectedWith(InsightError);
		});
		it("removeDataset: invalid id empty", () => {
			const res = insightFacade.removeDataset("");
			return expect(res).to.eventually.be.rejectedWith(InsightError);
		});

		it ("caching: remove works for new instance", async () => {
			await insightFacade.removeDataset("courses1");
			await insightFacade.addDataset("courses1", content1, sectionsType);

			// newInstance should still access courses0
			const newInstance = new InsightFacade();
			const result = await newInstance.removeDataset("courses1");
			expect(result).to.equal("courses1");
		});
	});

	// Add tests for listDataset
	describe("list api", function () {
		let insightFacade: InsightFacade;
		let content0: string;
		let content1: string;
		const sectionsType = InsightDatasetKind.Sections;
		const roomsType = InsightDatasetKind.Rooms;
		let campusContent: string;

		before(async () => {
			content0 = await getContentFromArchives("courses0.zip");
			content1 = await getContentFromArchives("courses1.zip");
			campusContent = await getContentFromArchives("campus.zip");
		});

		beforeEach(async () => {
			await clearDisk();
			insightFacade = new InsightFacade();

		});

		function sortById(a: InsightDataset, b: InsightDataset) {
			if (a.id < b.id) {
				return -1;
			} else if (a.id > b.id) {
				return 1;
			}
			return 0;
		}

		// Tests for listDatasets
		it("listDatasets: add 1, list 1, remove 0", async () => {
			await insightFacade.addDataset("courses0", content0, sectionsType);
			const result = await insightFacade.listDatasets();
			expect(result).to.have.length(1);
			expect(result[0].id).to.equal("courses0");
			expect(result[0].kind).to.deep.equal(sectionsType);
			expect(result[0].numRows).to.deep.equal(4);
		});

		it("listDatasets: add 2, remove none, and then remove 1", async () => {
			await insightFacade.addDataset("courses0", content0, sectionsType);
			await insightFacade.addDataset("courses1", content1, sectionsType);
			const result = await insightFacade.listDatasets();
			result.sort(sortById);
			expect(result).to.have.length(2);
			// console.log(result);
			expect(result[0].id).to.equal("courses0");
			expect(result[0].kind).to.deep.equal(sectionsType);
			expect(result[1].id).to.equal("courses1");
			expect(result[1].kind).to.deep.equal(sectionsType);

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

		it ("ls dataset add 1 for rooms", async () => {
			await insightFacade.addDataset("campus", campusContent, roomsType);
			const result = await insightFacade.listDatasets();
			expect(result).to.have.length(1);
			expect(result[0].id).to.equal("campus");
			expect(result[0].kind).to.deep.equal(roomsType);
			expect(result[0].numRows).to.equal(364);
		});

		it ("ls dataset add 1 for rooms 1 for sections", async () => {
			await insightFacade.addDataset("courses0", content0, sectionsType);
			await insightFacade.addDataset("dcampus", campusContent, roomsType);

			const result = await insightFacade.listDatasets();
			result.sort(sortById);
			expect(result).to.have.length(2);
			expect(result[0].id).to.equal("courses0");
			expect(result[0].kind).to.deep.equal(sectionsType);
			expect(result[1].id).to.equal("dcampus");
			expect(result[1].kind).to.deep.equal(roomsType);
			expect(result[1].numRows).to.equal(364);
		});

		it ("list: 2 buildings 1 no room", async () => {
			let oneNoRoomContent = await getContentFromArchives("2building1NoRoom.zip");
			await insightFacade.addDataset("rooms1", oneNoRoomContent, roomsType);
			const result = await insightFacade.listDatasets();
			expect(result[0].numRows).to.equal(5);
		});

		it ("caching: list works for new instance", async () => {
			await insightFacade.addDataset("courses0", content0, sectionsType);
			await insightFacade.addDataset("courses1", content1, sectionsType);

			const newInstance = new InsightFacade();
			const result = await newInstance.listDatasets();
			expect(result).to.have.length(2);
			result.sort(sortById);
			// console.log(result);
			expect(result[0].id).to.equal("courses0");
			expect(result[0].kind).to.deep.equal(sectionsType);
			expect(result[1].id).to.equal("courses1");
			expect(result[1].kind).to.deep.equal(sectionsType);
			expect(result[1].numRows).to.deep.equal(2);
		});

		it ("caching: list works for new instance, rooms", async () => {
			await insightFacade.addDataset("courses0", content0, sectionsType);
			await insightFacade.addDataset("dcampus", campusContent, roomsType);

			const newInstance = new InsightFacade();
			const result = await newInstance.listDatasets();
			expect(result).to.have.length(2);
			result.sort(sortById);
			// console.log(result);
			expect(result[0].id).to.equal("courses0");
			expect(result[0].kind).to.deep.equal(sectionsType);
			expect(result[1].id).to.equal("dcampus");
			expect(result[1].kind).to.deep.equal(roomsType);
		});

		it ("caching: new instance can add more and list", async () => {
			await insightFacade.addDataset("courses0", content0, sectionsType);
			const newInstance = new InsightFacade();

			await newInstance.addDataset("courses1", content1, sectionsType);
			const result = await newInstance.listDatasets();
			expect(result).to.have.length(2);

			// old instance remove, new instance list gets updated
			await insightFacade.removeDataset("courses1");
			const res = await newInstance.listDatasets();
			expect(res).to.have.length(1);
			expect(res[0].id).to.equal("courses0");
			expect(res[0].kind).to.deep.equal(sectionsType);
		});

		it ("caching: new instance can add more and list with rooms added first", async () => {
			await insightFacade.addDataset("campus", campusContent, roomsType);
			const newInstance = new InsightFacade();

			await newInstance.addDataset("courses1", content1, sectionsType);
			const result = await newInstance.listDatasets();
			expect(result).to.have.length(2);
			result.sort(sortById);
			expect(result[0].id).to.equal("campus");
			expect(result[1].id).to.equal("courses1");

			// old instance remove, new instance list gets updated
			await insightFacade.removeDataset("courses1");
			const res = await newInstance.listDatasets();
			expect(res).to.have.length(1);
			expect(res[0].id).to.equal("campus");
			expect(res[0].kind).to.deep.equal(roomsType);
		});
	});

	/*
	 * This test suite dynamically generates tests from the JSON files in test/resources/queries.
	 * You can and should still make tests the normal way, this is just a convenient tool for a majority of queries.
	 */
	describe("PerformQuery", function () {
		before(async function () {
			await clearDisk();
			facade = new InsightFacade();
			courses1 = await getContentFromArchives("courses1.zip");
			const rooms = await getContentFromArchives("campus.zip");

			// Add the datasets to InsightFacade once.
			// Will *fail* if there is a problem reading ANY dataset.
			const loadDatasetPromises = [
				facade.addDataset("sections", sections, InsightDatasetKind.Sections),
				facade.addDataset("courses0", courses0, InsightDatasetKind.Sections),
				facade.addDataset("courses1", courses1, InsightDatasetKind.Sections),
				facade.addDataset("rooms", rooms, InsightDatasetKind.Rooms),
			];

			try {
				await Promise.all(loadDatasetPromises);
			} catch (err) {
				throw new Error(`In PerformQuery Before hook, dataset(s) failed to be added. \n${err}`);
			}
		});

		after(async function () {
			await clearDisk();
		});

		describe("valid queries", function () {
			let validQueries: ITestQuery[];
			try {
				validQueries = readFileQueries("valid");
			} catch (e: unknown) {
				expect.fail(`Failed to read one or more test queries. ${e}`);
			}

			validQueries.forEach(function (test: any) {
				it(`${test.title}`, async function () {
					if (test.errorExpected) {
						try {
							await facade.performQuery(test.input);
							assert.fail("performQuery: expected an error but none was thrown");
						} catch (e) {
							// expected error
							console.log(`performQuery: expected error: ${e}`);
						}
					} else {
						try {
							const result = await facade.performQuery(test.input);

							// unsorted test
							if (test.input?.OPTIONS && !test.input.OPTIONS.ORDER) {
								return expect(result).to.deep.members(test.expected);
							} else if (test.input?.OPTIONS?.ORDER) {
								// sorted test w/ further grouping if results have same value
								// in that case, it would test the group as unsorted
								const orderKey = test.input.OPTIONS.ORDER;
								const groupedResult = groupBy(result, orderKey);
								const groupedExpected = groupBy(test.expected, orderKey);

								for (const key in groupedResult) {
									expect(groupedResult[key]).to.have.deep.members(groupedExpected[key]);
								}
							}

							// // unsorted test
							// if (test.input?.OPTIONS && !test.input.OPTIONS.ORDER) {
							// 	return expect(result).to.deep.members(test.expected);
							// }
							// // sorted test
							// expect(result).to.deep.equal(test.expected);

							// console.log("result: ", result); // print results
							// console.log("expected: ", test.expected);
						} catch (e) {
							assert.fail(`performQuery: threw an unexpected error: ${e}`);
						}
					}
				});
			});
		});

		describe("invalid queries", function () {
			let invalidQueries: ITestQuery[];

			try {
				invalidQueries = readFileQueries("invalid");
			} catch (e: unknown) {
				expect.fail(`Failed to read one or more test queries. ${e}`);
			}

			invalidQueries.forEach(function (test: ITestQuery) {
				it(`${test.title}`, async function () {
					try {
						const result = await facade.performQuery(test.input);
						assert.fail(`performQuery resolved when it should have rejected with ${test.expected}`);
					} catch (err) {
						if (test.expected === "InsightError") {
							expect(err).to.be.instanceOf(InsightError);
						} else {
							assert.fail("Query threw unexpected error");
						}
					}
				});
			});
		});
	});
});

function groupBy(array: any[], key: string) {
	return array.reduce((result, item) => {
		(result[item[key]] = result[item[key]] || []).push(item);
		return result;
	}, {});
}
