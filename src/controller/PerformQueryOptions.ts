import {Section} from "../type/Section";
import {InsightResult} from "./IInsightFacade";
import {getKeyId} from "./PerformQueryHelper";

export interface Options {
	COLUMNS: string[];
	ORDER?: string;
}

const columnKeys = ["avg", "pass", "fail", "audit", "year", "dept", "id", "instructor", "title", "uuid"];

// Takes columns in options query, and filters for each section
function filterColumns(columns: string[], section: any): InsightResult {
	const result: InsightResult = {};
	for (const column of columns) {
		const id = getKeyId(column);
		if (id in section) {
			result[column] = section[id];
		}
	}
	return result;
}

// Takes data of Section[] and Option from query, returns results with filtered columns in order
export async function handleOptions(data: Section[], options: Options): Promise<InsightResult[]> {
	// sorted by specified column in asc order
	if (options.ORDER) {
		const orderBy = getKeyId(options.ORDER);
		data.sort((a: Section, b: Section) => {
			if (a[orderBy as keyof typeof a] < b[orderBy as keyof typeof b]) {
				return -1;
			}
			return 1;
		});
	}

	// iterate through data, reduce to only columns specified
	const res: InsightResult[] = data.map((section: Section) => filterColumns(options.COLUMNS, section));
	return res;
}


// Takes column key and returns true if it is valid
export function isValidKey(key: string): boolean {
	if (columnKeys.includes(key)) {
		return true;
	}
	return false;
}

// Iterate through columns in options and returns true if all valid
export function isValidColumns(options: Options): boolean {
	for (const column of options.COLUMNS) {
		const key = getKeyId(column);
		if (!isValidKey(key)) {
			return false;
		}
	}

	return true;
}

// Validates options are formatted correctly to EBNF
export function isValidOptions(options: Options): boolean {
	if (!options.COLUMNS) {
		return false;
	}

	if (options.ORDER) {
		const orderKey = getKeyId(options.ORDER);
		if (!columnKeys.includes(orderKey)) {
			return false;
		}
	}

	if (!isValidColumns(options)) {
		return false;
	}

	return true;
}
