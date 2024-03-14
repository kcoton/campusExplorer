import JSZip from "jszip";
import {InsightError} from "./IInsightFacade";
import {Room, Building} from "../type/Room";
import fs from "fs-extra";
import path from "path";
import InsightFacade from "./InsightFacade";
import {Attribute} from "parse5/dist/common/token";

export async function addRoom(id: string, content: string, insightFacade: InsightFacade): Promise<string[]> {
	try {
		let jszip = new JSZip();
		const zip = await jszip.loadAsync(content, {base64: true});
		let rooms = Object.keys(zip.files);
		const parse5 = require("parse5");
        // console.log(rooms);
		await zip.file("index.htm")?.async("string").then((indexHTMLContent) => {
			const htmlParse = parse5.parse(indexHTMLContent);
			// console.log(htmlParse.childNodes);
			let buildingTable = findBuildingTable(htmlParse);
			if (!buildingTable) {
				return Promise.reject(new InsightError("There is no valid building table in the index.html file"));
			}
			let buildingsList: Building[] = [];
			getBuildingsList(buildingTable, buildingsList);
			console.log(buildingsList);
		});

		return Promise.reject("Not implemented");
	} catch (error) {
		console.log(error);
		return Promise.reject("Error while adding new dataset!");
	}
}

function getBuildingsList(table: ChildNode, buildingsList: Building[]) {
	// const tbody = Array.from(table.childNodes).find((elt) => elt.nodeName === "tbody");
	// const trows = Array.from(tbody?.childNodes).filter((elt) => elt.nodeName === "tr");
	for (const child of table.childNodes) {
		if (child.nodeName === "tbody") {
			for (const tr of child.childNodes) {
				if (tr.nodeName === "tr") {
					let building: Building = {
						shortname: "",
						fullname: "",
						address: "",
						lat: 0,
						lon: 0,
						href: ""
					};
					for (const td of tr.childNodes) {
						if (td.nodeName === "td") {
							if ("attrs" in td && Array.isArray(td.attrs)) {
								if (td.attrs[0].value.includes("building-code")){
									let text = Array.from(td.childNodes).find((elt) => elt.nodeName === "#text");
									if (text && "value" in text && typeof text.value === "string" ) {
										building.shortname = text.value.trim();
									}
								}
								if (td.attrs[0].value.includes("views-field-title")){
									const a = Array.from(td.childNodes).find((elt) => elt.nodeName === "a");
									// let href = getAttrs(a).find((e) => e.name === "href")?.value;
									// building.href = href ? href : "";
									if (a && "attrs" in a && Array.isArray(a.attrs)) {
										let href = a.attrs[0].value;
										building.href = href ? href : "";
									}

									if (a) {
										let text = Array.from(a.childNodes).find((elt) => elt.nodeName === "#text");
										if (text && "value" in text && typeof text.value === "string" ) {
											building.fullname = text.value;
										}
									}
								}
								if (td.attrs[0].value.includes("building-address")){
									let text = Array.from(td.childNodes).find((elt) => elt.nodeName === "#text");
									if (text && "value" in text && typeof text.value === "string" ) {
										building.address = text.value.trim();
									}
								}
							}
						}
					}
					buildingsList.push(building);
				}
			}
		}
	}
}

function getAttrs(element: any): Attribute[] {
	if ("attrs" in element && Array.isArray(element.attrs)) {
		return Array.from(element);
	} else {
		return [];
	}
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
