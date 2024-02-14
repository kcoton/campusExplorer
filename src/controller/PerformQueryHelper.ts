import * as fs from "fs-extra";
import {Options, handleOptions, isValidOptions} from "./PerformQueryOptions";
import {Section} from "../type/Section";

export interface Query {
	WHERE: any[];
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

// TODO: validate WHERE condition
// Validates query format is valid to EBNF
export function isValidQuery(query: Query): boolean {
	if (!query.WHERE || !query.OPTIONS) {
		return false;
	}

	if (!isValidOptions(query.OPTIONS)) {
		return false;
	}

	return true;
}

export function handleCompare(section: Section, query: Query) {
	//
}

export async function handleWhere(data: Section[], query: Query) {
	const res = data.map((section: Section) => handleCompare(section, query));
}


/** local testing -- ignore */
export async function main() {
	let orderAndSortResult;
	const dataResult = await getData("../mock/mock-courses.json");
	const queryResult = await getQuery("../mock/mock-query.json");
	if (isValidQuery(queryResult)) {
		orderAndSortResult = await handleOptions(dataResult.data, queryResult.OPTIONS);
	}
}

void main();
