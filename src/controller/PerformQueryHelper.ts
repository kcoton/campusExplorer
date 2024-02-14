import * as fs from "fs-extra";
import {Section} from "../type/Section";
import {InsightResult} from "./IInsightFacade";

export interface Query {
	WHERE: any[];
	OPTIONS: Options;
}

export interface Options {
	COLUMNS: string[];
	ORDER: string;
}

// Reads course data from json file
export async function getData(path: string): Promise<any> {
	const data = await JSON.parse(fs.readFileSync(path, "utf-8"));
	return data;
}

// Reads query from json file
export async function getQuery(path: string): Promise<Query> {
	const query = await JSON.parse(fs.readFileSync(path, "utf-8"));
	return query;
}

// Takes columns in options query, and filters for each section
function filterColumns(columns: string[], section: any): InsightResult {
	const result: InsightResult = {};
	for (const column of columns) {
		const id = column.split("_")[1];
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
		const orderBy = options.ORDER.split("_")[1];
		data.sort((a: any, b: any) => {
			if (a[orderBy] < b[orderBy]) {
				return -1;
			}
			return 1;
		});
	}

	// iterate through data, reduce to only columns specified
	const res: InsightResult[] = data.map((section: Section) => filterColumns(options.COLUMNS, section));
	return res;
}


/** local testing -- ignore */
export async function main() {
	const dataResult = await getData("../mock/mock-courses.json");
	const queryResult = await getQuery("../mock/mock-query.json");
	// const optionResult = await getOptions(queryResult);
	const orderAndSortResult = await handleOptions(dataResult.data, queryResult.OPTIONS);
}

void main();
