import {Section} from "../type/Section";
import {InsightError} from "./IInsightFacade";
import {Query, getKeyId} from "./PerformQueryHelper";

export interface Comparator {
	[key: string]: number | string;
}

export interface Condition {
	AND?: Condition[];
	OR?: Condition[];
	GT?: Comparator;
	LT?: Comparator;
	EQ?: Comparator;
	IS?: Comparator;
	NOT?: Comparator;
}

function handleCondition(section: Section, condition: Condition): boolean {
	if (condition.AND) {
		return condition.AND.every((cond) => handleCondition(section, cond));

	} else if (condition.OR) {
		return condition.OR.some((cond) => handleCondition(section, cond));

	} else if (condition.GT) {
		const field = Object.keys(condition.GT)[0];
		const id = getKeyId(field);
		const res = section[id as keyof typeof section] > condition.GT[field];
		return res;

	} else if (condition.LT) {
		const field = Object.keys(condition.LT)[0];
		const id = getKeyId(field);
		const res = section[id as keyof typeof section] < condition.LT[field];
		return res;

	} else if (condition.EQ) {
		const field = Object.keys(condition.EQ)[0];
		const id = getKeyId(field);
		const res = section[id as keyof typeof section] === condition.EQ[field];
		return res;

	} else if (condition.IS) {
		const field = Object.keys(condition.IS)[0];
		const id = getKeyId(field);
		return matchWithWildcard(section[id as keyof typeof section], condition.IS[field] as string);

	} else if (condition.NOT) {
		return !handleCondition(section, condition.NOT);
	}

	throw new InsightError("performQuery: not a valid comparator");
}

function matchWithWildcard(value: string | number, pattern: string): boolean {
	let regexPattern = pattern
		.replace(/([.+?^=!:${}()|[\]/\\])/g, "\\$1")
		.replace(/\*/g, ".*");

	regexPattern = `^${regexPattern}$`;
	const regex = new RegExp(regexPattern);
	const result = regex.test(value as string);
	return result;
}

export async function handleWhere(data: Section[], query: Query): Promise<Section[]> {
	const filteredData: Section[] = data.filter((section) => handleCondition(section, query.WHERE));
	return filteredData;
}

