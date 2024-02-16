import * as fs from "fs-extra";
import {Options, handleOptions, isValidOptions} from "./PerformQueryOptions";
import {Condition, handleWhere} from "./PerformQueryWhere";
import {InsightError} from "./IInsightFacade";

export interface Query {
	WHERE: Condition;
	OPTIONS: Options;
}

// Validates query format is valid to EBNF
export function isValidQuery(uncheckedQuery: unknown): boolean {
	if (typeof uncheckedQuery !== "object") {
		return false;
	}

	const query: Query = uncheckedQuery as Query;

	if (typeof query.WHERE !== "object" || typeof query.OPTIONS !== "object" || Array.isArray(query.WHERE)) {
		return false;
	}

	if (!isValidOptions(query.OPTIONS)) {
		return false;
	}

	return true;
}

// Extracts the id from the key (i.e. section_avg -> avg) or datasetId (i.e. section_avg -> section)
export function getKeyId(key: string, dataset?: boolean): string {
	const id = key.split("_");
	return dataset ? id[0] : id[1];
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
