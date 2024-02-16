import * as fs from "fs-extra";
import {Options, handleOptions, isValidOptions} from "./PerformQueryOptions";
import {Condition, handleWhere} from "./PerformQueryWhere";
import {InsightError} from "./IInsightFacade";

export interface Query {
	WHERE: Condition;
	OPTIONS: Options;
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

// Validates query format is valid to EBNF
export function isValidQuery(uncheckedQuery: unknown): boolean {
	if (typeof uncheckedQuery !== "object") {
		return false;
	}

	const query: Query = uncheckedQuery as Query;

	if (!query.WHERE || !query.OPTIONS) {
		return false;
	}

	if (typeof query.WHERE !== "object" || typeof query.OPTIONS !== "object") {
		return false;
	}

	if (!isValidOptions(query.OPTIONS)) {
		return false;
	}

	return true;
}

// Extracts the id from the key (i.e. section_avg -> avg)
export function getKeyId(key: string): string {
	const id = key.split("_")[1];
	return id;
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
