import {Room} from "../type/Room";
import {Section} from "../type/Section";
import {InsightError} from "./IInsightFacade";
import {Query, getKeyId} from "./PerformQueryHelper";
import Decimal from "decimal.js";

export interface Transformation {
	GROUP: string[];
	APPLY: any[];
}

export interface Apply {
	[applyKey: string]: any;
}

export const applyKeys = ["MAX", "MIN", "AVG", "COUNT", "SUM"];

// Takes data of Section[] or Room[] and query, returns transformed data after group + apply
export async function handleTransformations(data: Section[] | Room[], query: Query): Promise<Section[] | Room[]> {
	// TRANSFORMATIONS is optional, if not specified, return data as is
	if (query.TRANSFORMATIONS === undefined || query.TRANSFORMATIONS === null) {
		return data;
	}

	const transformations = query.TRANSFORMATIONS;
	const group = transformations.GROUP;
	const apply = transformations.APPLY;

	// Group the data by the GROUP keys
	const groupResult = handleGroup(data, group);
	// Apply the APPLY keys to the grouped data
	const transformedData: Section[] | Room[] = handleApply(groupResult, apply);

	return transformedData;
}

// Takes data of Section[] or Room[] and group keys, returns grouped data based on group keys
export function handleGroup(data: Section[] | Room[], group: string[]) {
	// sorts groups into dictionary where key is group key and value is array of items with the same group key
	const groupResult: any = {};
	for (const item of data) {
		const groupKey = getGroupKey(item, group);
		if (!groupResult[groupKey]) {
			groupResult[groupKey] = [];
		}
		groupResult[groupKey].push(item);
	}
	return groupResult;
}

export function getGroupKey(item: any, group: string[]) {
	let groupKey = [];
	for (const key of group) {
		const keyId = getKeyId(key);
		groupKey.push(item[keyId]);
	}
	return groupKey.toString();
}


// Takes grouped data and apply keys, returns transformed data after apply
// groupResult: { groupKey: [item1, item2, ...] }
export function handleApply(groupResult: any, apply: any[]): Section[] | Room[] {
	const transformedData: Section[] | Room[] = [];

	// for each group, apply the apply keys and add the result to the data
	for (const groupKey in groupResult) {
		const groupData = groupResult[groupKey]; // array of Section[] or Room[] items with the same group key
		const applyResult: Apply = {};

		for (const applyItem of apply) { // applyItem { "overallAvg": { "AVG": sections_avg } }
			const applyKey = Object.keys(applyItem)[0]; // "overallAvg"
			const applyValue = applyItem[applyKey]; // { "AVG": sections_avg }
			const applyToken = Object.keys(applyValue)[0]; // "AVG"
			const applyField = applyValue[applyToken]; // "sections_avg"

			applyResult[applyKey] = handleApplyToken(applyToken, groupData, applyField); // { "overallAvg": 80 }
		}

		// add the transformed item to the transformed data
		const transformedItem = {...groupData[0], ...applyResult};
		transformedData.push(transformedItem);
	}

	return transformedData;
}

export function handleApplyToken(applyToken: string, groupData: Section[] | Room[], applyField: string) {
	const applyFieldKey = getKeyId(applyField);
	// Check if applyFieldKey is numeric for MAX, MIN, AVG, and SUM
	if (["MAX", "MIN", "AVG", "SUM"].includes(applyToken)) {
		const value = groupData[0][applyFieldKey as keyof (Section | Room)];
		if (isNaN(Number(value))) {
			throw new InsightError("performQueryTransformations: applyFieldKey must \
				be numeric for MAX, MIN, AVG, and SUM");
		}
	}

	switch (applyToken) {
		case "MAX":
			return handleMax(groupData, applyFieldKey);
		case "MIN":
			return handleMin(groupData, applyFieldKey);
		case "AVG":
			return handleAvg(groupData, applyFieldKey);
		case "COUNT":
			return handleCount(groupData, applyFieldKey);
		case "SUM":
			return handleSum(groupData, applyFieldKey);
		default:
			throw new InsightError("performQueryTransformations: invalid apply token");
	}
}

// Returns max value
export function handleMax(groupData: Section[] | Room[], applyFieldKey: string) {
	let max = -Number.MAX_VALUE;
	for (const item of groupData) {
		if (max < item[applyFieldKey as keyof (Section | Room)]) {
			max = Number(item[applyFieldKey as keyof (Section | Room)]);
		}
	}
	return max === -Number.MAX_VALUE ? 0 : max;
}

// Returns min value
export function handleMin(groupData: Section[] | Room[], applyFieldKey: string) {
	let min = Number.MAX_VALUE;
	for (const item of groupData) {
		if (min > item[applyFieldKey as keyof (Section | Room)]) {
			min = Number(item[applyFieldKey as keyof (Section | Room)]);
		}
	}
	return min === Number.MAX_VALUE ? 0 : min;
}

// Returns average rounded to 2 decimal places
export function handleAvg(groupData: Section[] | Room[], applyFieldKey: string) {
	let total = new Decimal(0);
	const numRows = groupData.length;

	for (const item of groupData) {
		total = total.add(new Decimal(item[applyFieldKey as keyof (Section | Room)]));
	}

	const avg = total.toNumber() / numRows;
	return Number(avg.toFixed(2));
}

// Returns number of unique items
export function handleCount(groupData: Section[] | Room[], applyFieldKey: string) {
	const countSet = new Set();
	for (const item of groupData) {
		countSet.add(item[applyFieldKey as keyof (Section | Room)]);
	}
	return countSet.size;
}

// Returns sum rounded to 2 decimal places
export function handleSum(groupData: Section[] | Room[], applyFieldKey: string) {
	let sum = new Decimal(0);

	for (const item of groupData) {
		sum = sum.add(new Decimal(item[applyFieldKey as keyof (Section | Room)]));
	}
	return Number(sum.toFixed(2));
}
