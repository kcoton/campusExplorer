import Server from "../../src/rest/Server";
import InsightFacade from "../../src/controller/InsightFacade";

import {expect} from "chai";
import request, {Response} from "supertest";
import {clearDisk, getContentFromArchives} from "../TestUtil";
import {InsightDatasetKind} from "../../src/controller/IInsightFacade";

describe("Facade D3", function () {

	let facade: InsightFacade;
	let server: Server;

	const SERVER_URL = "http://localhost:4321";

	// Declare datasets used in tests. You should add more datasets like this!
	let sections: string;
	let courses0: string;
	let courses1: string;
	let rooms: string;

	before(async function () {
		await clearDisk();
		facade = new InsightFacade();
		server = new Server(4321);

		// This block runs once and loads the datasets.
		sections = await getContentFromArchives("pair.zip");
		courses0 = await getContentFromArchives("courses0.zip");
		courses1 = await getContentFromArchives("courses1.zip");
		rooms = await getContentFromArchives("campus.zip");

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
			console.log("All datasets loaded successfully");
		} catch (err) {
			throw new Error(`In PerformQuery Before hook, dataset(s) failed to be added. \n${err}`);
		}

		try {
			await server.start();
		} catch (err) {
			console.error("Server failed to start");
		}
	});

	after(async function () {
		try {
			await server.stop();
		} catch (err) {
			console.error("Server failed to stop");
		}
	});

	beforeEach(function () {
		// might want to add some process logging here to keep track of what is going on
	});

	afterEach(function () {
		// might want to add some process logging here to keep track of what is going on
	});

	// Sample on how to format PUT requests
	// The other endpoints work similarly. You should be able to find all instructions at the supertest documentation
	/*
	it("PUT test for courses dataset", function () {
		try {
			return request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err) {
					// some logging here please!
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
		}
	});
	*/
	// PUT requests
	it("PUT test code 200, sections", () => {
		try {
			const buffer = Buffer.from(courses0, "base64");
			return request(SERVER_URL)
				.put("/dataset/mysections/sections")
				.send(buffer)
				.set("Content-Type", "application/x-zip-compressed")
				.then((res: Response) => {
					console.log("PUT query endpoint success", res.status, res.body);
					expect(res.status).to.be.equal(200);
				})
				.catch((err) => {
					console.log("PUT query error", err);
					expect.fail();
				});
		} catch (err) {
			console.log("PUT request error", err);
		}
	});

	it("PUT test code 200, rooms", () => {
		try {
			const buffer = Buffer.from(rooms, "base64");
			return request(SERVER_URL)
				.put("/dataset/myrooms/rooms")
				.send(buffer)
				.set("Content-Type", "application/x-zip-compressed")
				.then((res: Response) => {
					console.log("PUT query endpoint success", res.status, res.body);
					expect(res.status).to.be.equal(200);
				})
				.catch((err) => {
					console.log("PUT query error", err);
					expect.fail();
				});
		} catch (err) {
			console.log("PUT request error", err);
		}
	});

	it("PUT code 400, sections", () => {
		try {
			const buffer = Buffer.from(courses1, "base64");
			return request(SERVER_URL)
				.put("/dataset/courses1/rooms")
				.send(buffer)
				.set("Content-Type", "application/x-zip-compressed")
				.then((res: Response) => {
					// console.log("PUT query endpoint success", res.status, res.body);
					expect(res.status).to.be.equal(400);
				})
				.catch((err) => {
					console.log("PUT query error", err);
					// should pass
				});
		} catch (err) {
			console.log("PUT request error", err);
		}
	});

	it("PUT code 400, invalid type", () => {
		try {
			const buffer = Buffer.from(courses1, "base64");
			return request(SERVER_URL)
				.put("/dataset/courses1/haha")
				.send(buffer)
				.set("Content-Type", "application/x-zip-compressed")
				.then((res: Response) => {
					// console.log("PUT query endpoint success", res.status, res.body);
					expect(res.status).to.be.equal(400);
				})
				.catch((err) => {
					console.log("PUT query error", err);
					// should pass
				});
		} catch (err) {
			console.log("PUT request error", err);
		}
	});

	// DELETE endpoint tests
	it("DELETE code 200, sections", function() {
		try {
			return request(SERVER_URL)
				.delete("/dataset/courses1")
				.then((res: Response) => {
					console.log("DELETE query endpoint success", res.status, res.body);
					expect(res.status).to.be.equal(200);
				})
				.catch((err) => {
					console.log("DELETE query error", err);
					expect.fail();
				});
		} catch (err) {
			console.log("DELETE request error", err);
		}
	});

	it("DELETE code 200, rooms", function() {
		try {
			return request(SERVER_URL)
				.delete("/dataset/rooms")
				.then((res: Response) => {
					console.log("DELETE query endpoint success", res.status, res.body);
					expect(res.status).to.be.equal(200);
				})
				.catch((err) => {
					console.log("DELETE query error", err);
					expect.fail();
				});
		} catch (err) {
			console.log("DELETE request error", err);
		}
	});

	it("DELETE code 404 not found id", function() {
		try {
			return request(SERVER_URL)
				.delete("/dataset/roomsss")
				.then((res: Response) => {
					// console.log("DELETE query endpoint success", res.status, res.body);
					expect(res.status).to.be.equal(404);
				})
				.catch((err) => {
					console.log("DELETE query error", err);
					// should pass
				});
		} catch (err) {
			console.log("DELETE request error", err);
		}
	});

	it("DELETE code 400 invalid id underscore", function() {
		try {
			return request(SERVER_URL)
				.delete("/dataset/__")
				.then((res: Response) => {
					// console.log("DELETE query endpoint success", res.status, res.body);
					expect(res.status).to.be.equal(400);
				})
				.catch((err) => {
					console.log("DELETE query error", err);
					// should pass
				});
		} catch (err) {
			console.log("DELETE request error", err);
		}
	});

	// GET /datasets returns a list of all datasets
	it("GET /datasets should pass", function () {
		try {
			return request(SERVER_URL)
				.get("/datasets")
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					console.log("GET datasets endpoint success", res.status, res.body);
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err) {
					console.log("GET datasets response error", err);
					expect.fail();
				});
		} catch (err) {
			console.log("GET datasets request error", err);
		}
	});

	// POST /query sends json query to performQuery
	it("POST /query should pass", function () {
		const query = {
			WHERE: {
				IS: {
					myrooms_href: "*s*"
				}
			},
			OPTIONS: {
				COLUMNS: [
					"myrooms_shortname",
					"myrooms_lat",
					"myrooms_lon",
					"minLon"
				],
				ORDER: {
					dir: "UP",
					keys: [
						"minLon"
					]
				}
			},
			TRANSFORMATIONS: {
				GROUP: [
					"myrooms_shortname",
					"myrooms_lat",
					"myrooms_href",
					"myrooms_lon"
				],
				APPLY: [
					{
						minLon: {
							MIN: "myrooms_lon"
						}
					}
				]
			}
		};

		try {
			return request(SERVER_URL)
				.post("/query")
				.set("Content-Type", "application/json")
				.send(query)
				.then(function (res: Response) {
					// console.log("POST query endpoint success", res.status, res.body);
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err) {
					console.log("POST query response error", err);
					expect.fail();
				});
		} catch (err) {
			console.log("POST query request error", err);
		}
	});


	/* additional endpoints for frontend */

	// GET /buildings returns a list of all buildings for each dataset
	it("GET /buildings should pass", function () {
		try {
			return request(SERVER_URL)
				.get("/buildings")
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// console.log("GET buildings endpoint success", res.status, res.body);
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err) {
					console.log("GET buildings response error", err);
					expect.fail();
				});
		} catch (err) {
			console.log("GET buildings request error", err);
		}
	});
});
