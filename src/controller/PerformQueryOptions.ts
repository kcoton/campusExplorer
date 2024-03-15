import {Room} from "../type/Room";
import {Section} from "../type/Section";
import {InsightError, InsightResult} from "./IInsightFacade";
import {getKeyId} from "./PerformQueryHelper";

export interface Options {
	COLUMNS: string[];
	ORDER?: string | Order; // ORDER: '' or ORDER: {dir: 'UP', keys: ['avg']}
}

export interface Order {
	dir: string;
	keys: string[];
}

export const sKeys = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];
export const mKeys = ["dept", "id", "instructor", "title", "uuid", "fullname", "shortname", "number", "name",
	"address", "type", "furniture", "href"];
export const sectionKeys = ["uuid", "id", "title", "instructor", "dept", "year", "avg", "pass", "fail", "audit"];
export const roomKeys = ["fullname", "shortname", "number", "name", "address", "lat", "lon", "seats", "type",
	"furniture", "href"];
export const direction = ["UP", "DOWN"]; // UP = ascending, DOWN = descending

// Takes columns in options query, and filters for each item
export function filterColumns(columns: string[], item: any): InsightResult {
	const result: InsightResult = {};
	for (const column of columns) {
		const id = getKeyId(column);
		result[column] = item[id];
	}
	return result;
}

// Takes data of Section[] or Room[] and Option from query, returns results with filtered columns in order
export async function handleOptions(data: Section[] | Room[], options: Options): Promise<Section[] | Room[]> {
	// ORDER is optional, if not specified, return data as is
	if (options.ORDER === undefined || options.ORDER === null) {
		return data;
	}

	const order = options.ORDER;
	const columns = options.COLUMNS;

	// if ORDER exists, sort data by ORDER key(s) and direction
	if (typeof order === "string") {
		if (order.length === 0 || !isValidOrderKey(order, columns)) {
			throw new InsightError("performQuery: ORDER is empty string");
		}
		const orderBy = getKeyId(order);
		data.sort((a: Section | Room, b: Section | Room) => {
			const field = orderBy as keyof typeof a;
			if (a[field] <= b[field]) {
				return -1;
			}
			return 1;
		});
	} else if (typeof order === "object") {
		// check if all keys are valid and exist in Section or Room AND are present in the columns
		order.keys.forEach((key: string) => {
			if (!isValidOrderKey(key, columns)) {
				throw new InsightError("performQuery: ORDER keys are not valid");
			}
		});
		// sort data by ORDER key(s), sorts first in order of first key, then second key, etc.
		data.sort((a: Section | Room, b: Section | Room) => {
			for (const key of order.keys) {
				const field = getKeyId(key) as keyof typeof a;
				if (a[field] < b[field]) {
					return order.dir === "UP" ? -1 : 1;
				} else if (a[field] > b[field]) {
					return order.dir === "UP" ? 1 : -1;
				}
			}
			return 0;
		});
	} else {
		throw new InsightError("performQuery: ORDER is not a string or object");
	}

	return data;
}

// Takes key and returns true if it is a valid key that is present in the columns
// Parameter key should be the full key with underscore and all
// removeUnderscore by default is true to get keyId, in some circumstances like comparing column names directly we keep underscore
export function isValidKey(key: string, columns: string[], removeUnderscore: boolean = true): boolean {
	let id = key;
	if (removeUnderscore) {
		id = getKeyId(key);
	}
	return id.length > 0 && columns.includes(id);
}

// Order key is valid if it exists in the columns
// Since column keys include the underscore "datasetId_avg", we do not need to remove the underscore
export function isValidOrderKey(key: string, columns: string[]): boolean {
	return isValidKey(key, columns, false) && key.length > 0;
}

// Section key is valid if it either follows the format: "datasetId_sectionKey" OR doesn't include an "_"
export function isValidSectionKey(key: string): boolean {
	const keyId = getKeyId(key);
	return isValidKey(keyId, sectionKeys, false) || !key.includes("_");
}

// Room key is valid if it either follows the format: "datasetId_roomKey" OR doesn't include an "_"
export function isValidRoomKey(key: string): boolean {
	const keyId = getKeyId(key);
	return isValidKey(keyId, roomKeys, false) || !key.includes("_");
}

// Takes direction and returns true if value is UP or DOWN
export function isValidDirection(dir: string): boolean {
	return direction.includes(dir) && dir.length > 0;
}
