import * as fs from "fs-extra";
import {getQuery, handleOptions} from "./PerformQueryOptions";

// Reads course data from json file
export async function getData(path: string): Promise<any> {
	const data = await JSON.parse(fs.readFileSync(path, "utf-8"));
	return data;
}


/** local testing -- ignore */
export async function main() {
	const dataResult = await getData("../mock/mock-courses.json");
	const queryResult = await getQuery("../mock/mock-query.json");
	const orderAndSortResult = await handleOptions(dataResult.data, queryResult.OPTIONS);
}

void main();
