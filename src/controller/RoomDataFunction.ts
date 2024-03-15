import JSZip from "jszip";
import {InsightError} from "./IInsightFacade";
import {Room, Building, GeoResponse} from "../type/Room";
import fs from "fs-extra";
import path from "path";
import InsightFacade from "./InsightFacade";
import {Attribute} from "parse5/dist/common/token";
import {IncomingMessage} from "http";
import {ChildNode} from "parse5/dist/tree-adapters/default";

const http = require("node:http");

export async function addRoom(id: string, content: string, insightFacade: InsightFacade): Promise<string[]> {
	try {
		let jszip = new JSZip();
		const zip = await jszip.loadAsync(content, {base64: true});
		// let rooms = Object.keys(zip.files);
		const parse5 = require("parse5");
		let roomDataList: Room[] = [];

		let buildingsList: Building[] = [];
		let buildingTable;
		await zip.file("index.htm")?.async("string").then((indexHTMLContent) => {
			const htmlParse = parse5.parse(indexHTMLContent);
			buildingTable = findBuildingTable(htmlParse);
			if (!buildingTable) {
				return Promise.reject(new InsightError("There is no valid building table in the index.html file!"));
			}
		});
		if (buildingTable) {
			await getBuildingsList(buildingTable, buildingsList);
		}

		await Promise.all(buildingsList.map(async (building) => {
			if (building.href) {
				await zip.file(building.href.substring(2))?.async("string").then((buildingHTMLContent) => {
					const htmlParse = parse5.parse(buildingHTMLContent);
					let roomTable = findRoomTable(htmlParse);
					if (roomTable) {
						addRoomList(roomTable, roomDataList, building);
					}
				});
			}
		}));

		if (roomDataList.length === 0) {
			return Promise.reject(new InsightError("No valid room in the dataset!"));
		}

		// store in disk
		const filePath = path.join(__dirname, "../../data/", `${id}.json`);
		await fs.outputJson(filePath, JSON.stringify(roomDataList, null, 2));

		insightFacade.datasetCache[id] = roomDataList;
		return Promise.resolve(Object.keys(insightFacade.datasetCache));
	} catch (error) {
		console.log(error);
		return Promise.reject(new InsightError("Error while adding new dataset!"));
	}
}

// ROOM HELPERS
function findRoomTable(node: ChildNode): ChildNode | null {
	if (node.nodeName === "table") {
		// console.log(htmlNode);

		// check table: valid table needs to have a td with class views-field-title
		if (isRoomTable(node)) {
			// console.log("Found the room table!");
			return node;
		}
	}

	if ("childNodes" in node){
		for (const child of node.childNodes) {
			const res = findRoomTable(child);
			if (res) {
				return res;
			}
		}
	}
	return null;
}

// get all rooms from the table and append it to the roomList, using building as the building context
function addRoomList(table: ChildNode, roomList: Room[], building: Building) {
	if ("childNodes" in table){
		for (const child of table.childNodes) {
			if (child.nodeName === "tbody") {
				for (const tr of child.childNodes) {
					if (tr.nodeName === "tr") {
						let room: Room = {
							fullname: building.fullname,
							shortname: building.shortname,
							number: null,
							name: null,
							address: building.address,
							lat: building.lat,
							lon: building.lon,
							seats: null,
							type: null,
							furniture: null,
							href: null
						};
						parseRoomFromTr(tr, room);
						if (room.number !== null && room.name !== null && room.seats !== null) {
							if ( room.type !== null && room.furniture !== null && room.href !== null) {
								roomList.push(room);
							} else {
								console.log(room);
							}
						} else {
							console.log(room);
						}
					}
				}
			}
		}
	}
}

function parseRoomFromTr(tr: ChildNode, room: Room) {
	if ("childNodes" in tr){
		for (const td of tr.childNodes) {
			if (td.nodeName === "td") {
				if ("attrs" in td && Array.isArray(td.attrs)) {
					if (td.attrs[0].value.includes(" views-field-field-room-capacity")){
						let text = Array.from(td.childNodes).find((elt) => elt.nodeName === "#text");
						if (text && "value" in text && typeof text.value === "string" ) {
							room.seats = parseInt(text.value.trim(), 10);
						}
					}
					if (td.attrs[0].value.includes(" views-field-field-room-number")){
						const a = Array.from(td.childNodes).find((elt) => elt.nodeName === "a");
					// let href = getAttrs(a).find((e) => e.name === "href")?.value;
					// building.href = href ? href : "";
						if (a && "attrs" in a && Array.isArray(a.attrs)) {
							let href = a.attrs[0].value;
							room.href = href ? href : "";
						}

						if (a && "childNodes" in a) {
							let text = Array.from(a.childNodes).find((elt) => elt.nodeName === "#text");
							if (text && "value" in text && typeof text.value === "string" ) {
								room.number = text.value;
							}
						}
					}
					if (td.attrs[0].value.includes(" views-field-field-room-furniture")){
						let text = Array.from(td.childNodes).find((elt) => elt.nodeName === "#text");
						if (text && "value" in text && typeof text.value === "string" ) {
							room.furniture = text.value.trim();
						}
					}
					if (td.attrs[0].value.includes(" views-field-field-room-type")){
						let text = Array.from(td.childNodes).find((elt) => elt.nodeName === "#text");
						if (text && "value" in text && typeof text.value === "string" ) {
							room.type = text.value.trim();
						}
					}
				}
			}
		}
	}
	room.name = room.shortname + "_" + room.number;
}

// verify the valid room table
function isRoomTable(node: ChildNode): boolean {
	if ("attrs" in node && Array.isArray(node.attrs)) {
		for (const at of node.attrs) {
			if (at.name === "class" && at.value.includes("views-field-field-room-number")) {
				return true;
			}
		}
	}
	if ("childNodes" in node) {
		for (const child of node.childNodes) {
			if (isRoomTable(child)) {
				return true;
			}
		}
	}
	return false;
}

// BUILDING HELPERS
async function getBuildingsList(table: ChildNode, buildingsList: Building[]) {
	if (!("childNodes" in table)){
		return;
	}
	const tbody = Array.from(table.childNodes).find((elt) => elt.nodeName === "tbody");
	if (!tbody || !("childNodes" in tbody)) {
		return;
	}
	await Promise.all(Array.from(tbody.childNodes).map(async (tr) => {
		if (tr.nodeName === "tr") {
			let building: Building = {
				shortname: null,
				fullname: null,
				address: null,
				lat: null,
				lon: null,
				href: null
			};
			await parseBuildingFromTr(tr, building);
			if (!(!building.fullname || !building.fullname || !building.address)) {
				if (!(!building.lat || !building.lon || !building.href)) {
					buildingsList.push(building);
				}
			}
		}
	}));
}

async function parseBuildingFromTr(tr: ChildNode, building: Building) {
	if (!("childNodes" in tr)) {
		return;
	}
	await Promise.all(Array.from(tr.childNodes).map(async (td: ChildNode) => {
		if (td.nodeName === "td") {
			if ("attrs" in td && Array.isArray(td.attrs)) {
				if (td.attrs[0].value.includes("views-field-field-building-code")){
					let text = Array.from(td.childNodes).find((elt) => elt.nodeName === "#text");
					if (text && "value" in text && typeof text.value === "string" ) {
						building.shortname = text.value.trim();
					}
				}
				if (td.attrs[0].value.includes("views-field-title")){
					const a = Array.from(td.childNodes).find((elt) => elt.nodeName === "a");
					if (a && "attrs" in a && Array.isArray(a.attrs)) {
						let href = a.attrs[0].value;
						building.href = href ? href : "";
					}

					if (a && "childNodes" in a) {
						let text = Array.from(a.childNodes).find((elt) => elt.nodeName === "#text");
						if (text && "value" in text && typeof text.value === "string" ) {
							building.fullname = text.value;
						}
					}
				}
				if (td.attrs[0].value.includes("views-field-field-building-address")){
					let text = Array.from(td.childNodes).find((elt) => elt.nodeName === "#text");
					if (text && "value" in text && typeof text.value === "string" ) {
						building.address = text.value.trim();
						const encodedAddress = encodeURIComponent(building.address);
						const url = `http://cs310.students.cs.ubc.ca:11316/api/v1/project_team096/${encodedAddress}`;
						const geoData: GeoResponse = await getGeolocation(url);
						if (geoData.error) {
							console.log(geoData.error);
						} else {
							building.lat = geoData.lat ? geoData.lat : 0;
							building.lon = geoData.lon ? geoData.lon : 0;
						}
					}
				}
			}
		}
	}));
}

function getGeolocation(url: string): Promise<GeoResponse> {
	return new Promise<GeoResponse>((resolve, reject) => {
		http.get(url, (res: IncomingMessage) => {
			let data = "";
			res.on("data", (chunk) => {
				data += chunk;
			});

			res.on("end", () => {
				try {
					const geoData = JSON.parse(data);
					resolve(geoData);
				} catch (err) {
					reject(err);
				}
			});
		}).on("error", (err: any) => {
			reject(err);
		});
	});
}

function findBuildingTable(htmlNode: ChildNode): ChildNode | null {
	if (htmlNode.nodeName === "table") {
		// console.log(htmlNode);

		// check table: valid table needs to have a td with class views-field-title
		if (isBuildingTable(htmlNode)) {
			console.log("Found the building table!");
			return htmlNode;
		}
	}

	if ("childNodes" in htmlNode){
		for (const child of htmlNode.childNodes) {
			const res = findBuildingTable(child);
			if (res) {
				return res;
			}
		}
	}
	return null;
}

function isBuildingTable(node: ChildNode): boolean {
	if ("attrs" in node && Array.isArray(node.attrs)) {
		for (const at of node.attrs) {
			if (at.name === "class" && at.value.includes("views-field-title")) {
				return true;
			}
		}
	}
	if ("childNodes" in node) {
		for (const child of node.childNodes) {
			if (isBuildingTable(child)) {
				return true;
			}
		}
	}
	return false;
}
