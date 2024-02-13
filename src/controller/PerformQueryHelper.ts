import * as fs from "fs-extra";
import {Section} from "../type/Section";

export interface Query {
	WHERE: any[];
	OPTIONS: Options;
}

export interface Options {
	COLUMNS: string[];
	ORDER: string;
}

// get mock data from disc
export async function getData(path: string): Promise<any> {
	const data = await JSON.parse(fs.readFileSync(path, "utf-8"));
	return data;
}

export async function getQuery(path: string): Promise<Query> {
	const query = await JSON.parse(fs.readFileSync(path, "utf-8"));
	return query;
}

// // get query options
// export async function getOptions(query: Query): Promise<any> {
// 	const options = query.OPTIONS;
// 	const prefix = options.COLUMNS[0].split("_")[0];
// 	const columns = options.COLUMNS.map((col) => col.split("_")[1]);
// 	const result: Options = {
// 		COLUMNS: columns,
// 		ORDER: options.ORDER
// 	};

// 	return result;
// }

function pick(props: any, object: any) {
	const result: any = {};
	for (const prop of props) {
		const id = prop.split("_")[1];
		if (id in object) {
			result[prop] = object[prop];
		}
	}
	return result;
}

// returns results with specific columns and order
export async function handleOptions(data: any, options: Options): Promise<any> {
	// iterate through result data, reduce to only columns specified
	const res = data.map((section: Section) => pick(options.COLUMNS, section));

	// return sorted by order
	if (options.ORDER) {
		const orderBy = options.ORDER.split("_")[1];
		res.sort((a: any, b: any) => {
			const t = a[orderBy];
			if (a[orderBy] < b[orderBy]) {
				return -1;
			}
			return 1;
		});
	}
}


/** local testing -- ignore */
export async function main() {
	const dataResult = await getData("../mock/mock-courses.json");
	const queryResult = await getQuery("../mock/mock-query.json");
	// const optionResult = await getOptions(queryResult);
	const res = await handleOptions(dataResult.data, queryResult.OPTIONS);
}

void main();
