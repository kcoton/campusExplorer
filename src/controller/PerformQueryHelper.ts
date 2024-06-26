import * as fs from "fs-extra";
import {Options, isValidDirection, isValidKey, isValidRoomKey,
	isValidSectionKey, roomKeys, sectionKeys} from "./PerformQueryOptions";
import {Condition, handleWhere} from "./PerformQueryWhere";
import {InsightDatasetKind, InsightError} from "./IInsightFacade";
import {Apply, Transformation} from "./PerformQueryTransformations";
import {Section} from "../type/Section";
import {Room} from "../type/Room";

export interface Query {
	WHERE: Condition;
	OPTIONS: Options;
	TRANSFORMATIONS?: Transformation;
}

// Validates query basic format type and required fields exist and are non-null
export function isValidQueryFormat(uncheckedQuery: unknown): boolean {
	// query should be a non-empty object
	if (typeof uncheckedQuery !== "object" || uncheckedQuery === null || Array.isArray(uncheckedQuery)) {
		return false;
	}

	const query: Query = uncheckedQuery as Query;

	// WHERE in query should be an object and must exist (can be empty)
	// OPTIONS, TRANSFORMATIONS in query should be non-null, non-empty objects and must exist
	if (typeof query.WHERE !== "object" || Array.isArray(query.WHERE) || query.WHERE === null || !query.OPTIONS
		|| typeof query.OPTIONS !== "object" || query.OPTIONS === null || Array.isArray(query.OPTIONS)
		|| (query.TRANSFORMATIONS && (typeof query.TRANSFORMATIONS !== "object" || query.TRANSFORMATIONS === null
		|| Array.isArray(query.TRANSFORMATIONS)))) {
		return false;
	}

	// COLUMNS in OPTIONS should be a non-empty array
	if (!query.OPTIONS.COLUMNS || !Array.isArray(query.OPTIONS.COLUMNS) || query.OPTIONS.COLUMNS.length === 0) {
		return false;
	}

	// ORDER in OPTIONS if present should be a string or object
	if (query.OPTIONS.ORDER && typeof query.OPTIONS.ORDER !== "string" && typeof query.OPTIONS.ORDER !== "object") {
		return false;
	}

	// if ORDER is an object, it should have a valid dir and keys
	if (typeof query.OPTIONS.ORDER === "object") {
		const order = query.OPTIONS.ORDER;
		if (!order.dir || !order.keys || order.keys.length === 0 || !isValidDirection(order.dir)) {
			return false;
		}
	}

	// GROUP in TRANSFORMATIONS should be a non-empty array
	if (query.TRANSFORMATIONS && (!query.TRANSFORMATIONS.GROUP || !Array.isArray(query.TRANSFORMATIONS.GROUP)
		|| query.TRANSFORMATIONS.GROUP.length === 0)) {
		return false;
	}

	// APPLY in TRANSFORMATIONS should be an array (can be empty)
	if (query.TRANSFORMATIONS && !Array.isArray(query.TRANSFORMATIONS.APPLY)) {
		return false;
	}

	// if APPLY is non-empty, it should be an array of non-empty APPLY objects
	if (query.TRANSFORMATIONS && query.TRANSFORMATIONS.APPLY.length > 0) {
		for (const apply of query.TRANSFORMATIONS.APPLY) {
			if (typeof apply !== "object" || apply === null || Array.isArray(apply)
				|| Object.keys(apply).length === 0) {
				return false;
			}
		}
	}

	return true;
}

// Validates column keys based on Section and Room interface
// Column keys should either be "id_key" or any non-underscore string
export function isValidColumns(options: Options, transformations: Transformation | undefined,
	data: Section[] | Room[]): boolean {
	const columnKeys = options.COLUMNS;
	const groupKeys = transformations?.GROUP;
	const applyKeys = transformations?.APPLY.map((a) => Object.keys(a)[0]);
	const datasetType = isSection(data) ? InsightDatasetKind.Sections : InsightDatasetKind.Rooms;

	// if transformations are present, check if the column keys are in the GROUP or APPLY keys
	// or check if the column keys are valid for the dataset type
	const allColumnKeysValid = columnKeys.every((key) => {
		// if no transformations, check if the key is valid for the dataset type ONLY and return false if not
		if (transformations === undefined) {
			return datasetType === InsightDatasetKind.Sections ?
				isValidKey(key, sectionKeys) : isValidKey(key, roomKeys);
		}

		// Check if the key is valid for the dataset type
		if ((datasetType === InsightDatasetKind.Sections && !isValidSectionKey(key)) ||
			(datasetType === InsightDatasetKind.Rooms && !isValidRoomKey(key))) {
			return false;
		}

		// If transformations are present, check if the key is in the GROUP or APPLY keys
		if (groupKeys !== undefined && groupKeys.length > 0 && applyKeys !== undefined && applyKeys.length > 0) {
			// If the key is not in group keys and not in apply keys, return false
			if (!groupKeys.includes(key) && !applyKeys.includes(key)) {
				return false;
			}

			if (datasetType === InsightDatasetKind.Sections) {
				// If the key is in group keys, check if it is a valid section key
				if (groupKeys.includes(key) && !isValidKey(key, sectionKeys)) {
					return false;
				}
			} else if (datasetType === InsightDatasetKind.Rooms) {
				// If the key is in group keys, check if it is a valid room key
				if (groupKeys.includes(key) && !isValidKey(key, roomKeys)) {
					return false;
				}
			}
		}

		return true;
	});

	return allColumnKeysValid;
}

export function isSection(data: any): data is Section[] {
	return "uuid" in data[0];
}

export function isRoom(data: any): data is Room[] {
	return "fullname" in data[0];
}

// Extracts the id from the key (i.e. section_avg -> avg) or datasetId (i.e. section_avg -> section)
// Takes into account if there is no underscore
export function getKeyId(key: string, dataset?: boolean): string {
	let resultKeyId = key;
	if (key.includes("_")) {
		const id = key.split("_");
		resultKeyId = dataset ? id[0] : id[1];
	}
	return resultKeyId;
}

// /** local testing -- ignore */
// export async function main() {
// 	const dataResult = await getData("../mock/mock-courses.json");
// 	const queryResult = await getQuery("../mock/mock-query.json");

// 	if (isValidQuery(queryResult)) {
// 		const whereResult = await handleWhere(dataResult.data, queryResult);
// 		const orderAndSortResult = await handleOptions(whereResult, queryResult.OPTIONS);
// 	}
// }

// void main();
