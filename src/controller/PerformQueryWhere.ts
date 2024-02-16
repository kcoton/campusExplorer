import {Section} from "../type/Section";
import {InsightError} from "./IInsightFacade";
import {Query, getKeyId} from "./PerformQueryHelper";
import {isValidKey, columnKeys} from "./PerformQueryOptions";

export const comparators = ["AND", "OR", "GT", "LT", "EQ", "IS", "NOT"];

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

// Takes section and returns true if evaluated to be query condition
function handleCondition(section: Section, condition: Condition): boolean {
	if (!isValidCondition(condition)) {
		throw new InsightError("performQuery: invalid condition or comparator");
	}

	if (condition.AND) {
		const res = condition.AND.every((cond) => handleCondition(section, cond));
		return res;
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

// IS values with wildcards return true if matches
function matchWithWildcard(value: string | number, pattern: string): boolean {
	if (/\w\*\w/.test(pattern)) {
		throw new InsightError("performQuery: invalid wildcard syntax"); // asterisk in the middle is invalid
	}

	let regexPattern = pattern
		.replace(/([.+?^=!:${}()|[\]/\\])/g, "\\$1")
		.replace(/\*/g, ".*");

	regexPattern = `^${regexPattern}$`;
	const regex = new RegExp(regexPattern);
	const result = regex.test(value as string);
	return result;
}

// Takes data of Section[] and query, returns results using filtered where condition
export async function handleWhere(data: Section[], query: Query): Promise<Section[]> {
	if (Object.keys(query.WHERE).length === 0) {
		return data;
	}
	const filteredData: Section[] = data.filter((section) => handleCondition(section, query.WHERE));
	return filteredData;
}

// Validates conditions are formatted correctly to EBNF
export function isValidCondition(condition: Condition): boolean {
    // Check for logical operators
	if (condition.AND && (condition.AND.length === 0 || !Array.isArray(condition.AND))) {
		return false;
	} else if (condition.OR && (condition.OR.length === 0 || !Array.isArray(condition.OR))) {
		return false;
	}

	if (condition.AND) { // taken from chatGPT
		for (const andCond of condition.AND) {
			// Check if the object combines multiple operators
			const keys = Object.keys(andCond);
			if (keys.length > 1 || keys.length === 0) {
				// Invalid if more than one operator or no operators are found
				return false;
			}
			// Additionally, check if the single operator's condition is valid
			const key = keys[0];
			if (!comparators.includes(key)) {
				// Invalid if the operator is not recognized
				return false;
			}
			if (!isValidCondition(andCond)) {
					// Recursively validate the condition of the single operator
				return false;
			}
		}
	}

	if (condition.OR) { // taken from chatGPT
		for (const orCond of condition.OR) {
			// Check if the object combines multiple operators
			const keys = Object.keys(orCond);
			if (keys.length > 1 || keys.length === 0) {
				// Invalid if more than one operator or no operators are found
				return false;
			}
			// Additionally, check if the single operator's condition is valid
			const key = keys[0];
			if (!comparators.includes(key)) {
				// Invalid if the operator is not recognized
				return false;
			}
			if (!isValidCondition(orCond)) {
					// Recursively validate the condition of the single operator
				return false;
			}
		}
	}

	if (condition.LT && !validateComparator(condition.LT)) {
		return false;
	} else if (condition.GT && !validateComparator(condition.GT)) {
		return false;
	} else if (condition.EQ && !validateComparator(condition.EQ)) {
		return false;
	} else if (condition.IS && !validateComparator(condition.IS, true)) { // IS should have string value
		return false;
	} else if (condition.NOT && (typeof condition.NOT !== "object" || !isValidCondition(condition.NOT))) {
		return false;
	}

	return true;
}

// Check for comparison operators with additional type validation
function validateComparator(comp: Comparator, shouldBeString: boolean = false): boolean {
	if (typeof comp !== "object" || Object.keys(comp).length !== 1) {
		return false;
	}
	const key = Object.keys(comp)[0];
	const value = comp[key];
    // Check if the key is one of the valid keys
	if (!columnKeys.includes(getKeyId(key))) {
		return false;
	}
    // Check if the value type matches the expected type (string for IS, number for GT, LT, EQ)
	return shouldBeString ? typeof value === "string" : typeof value === "number";
}
