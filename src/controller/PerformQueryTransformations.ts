import {Room} from "../type/Room";
import {Section} from "../type/Section";
import {Query} from "./PerformQueryHelper";

export interface Transformation {
	GROUP: string[];
	APPLY: any[];
}

export interface Apply {
	[applyKey: string]: any;
}


// Takes data of Section[] or Room[] and query, returns transformed data
export async function handleTransformations(data: Section[] | Room[], query: Query): Promise<Section[] | Room[]> {
	if (query.TRANSFORMATIONS && Object.keys(query.TRANSFORMATIONS).length === 0) {
		return data;
	}
	const transformedData: Section[] | Room[] = data;
	return transformedData;
}
