import JSZip from "jszip";
import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightResult,
	InsightError,
	NotFoundError,
	ResultTooLargeError
} from "./IInsightFacade";
import {Dataset, Section} from "../type/Section";
import fs from "fs-extra";
import path from "path";
import {isValidId, checkExistingId} from "../utils";
import {Query, getKeyId, isValidQuery} from "./PerformQueryHelper";
import {handleWhere} from "./PerformQueryWhere";
import {handleOptions} from "./PerformQueryOptions";
import { addSection } from "./SectionDataFunction";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */


export default class InsightFacade implements IInsightFacade {
	public datasetCache: Dataset; // array of all sections with id key

	constructor() {
		this.datasetCache = {};
		console.log("InsightFacadeImpl::init()");
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		const idExists = await checkExistingId(id);
		if (!isValidId(id) || idExists) {
			return Promise.reject(new InsightError("ID is invalid!"));
		}

		if (kind === InsightDatasetKind.Sections) {
			return addSection(id, content, this);
		} else {
			// call addRoom
			return Promise.reject("addRoom not implemented");
		}
	}

	public async removeDataset(id: string): Promise<string> {
		if (!isValidId(id)) {
			return Promise.reject(new InsightError("Invalid ID!"));
		}
		const existsId = await checkExistingId(id);
		if (!existsId) {
			return Promise.reject(new NotFoundError("ID does not exist: never added in the first place!"));
		}

		// delete the associated file of the dataset and delete id from datasetCache
		try {
			const filePath = path.join(__dirname, "../../data/", `${id}.json`);
			await fs.remove(filePath);
			if (this.datasetCache[id]) {
				this.datasetCache[id].pop();
			}

			console.log("delete success!");
			return Promise.resolve(id);
		} catch (err) {
			console.error(err);
			return Promise.reject(new InsightError("An error occurred while trying to remove"));
		}
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		let dataset: InsightDataset[] = [];

		const files = await fs.readdir(path.join(__dirname, "../../data/"));
		await Promise.all(files.map(async (file) => {
			const id = file.split(".")[0];
			const filePath = path.join(__dirname, "../../data/", file);
			const datasetContent = await fs.readJson(filePath);

			let insightData: InsightDataset = {
				id: id,
				kind: InsightDatasetKind.Sections,
				numRows: JSON.parse(datasetContent).length
			};
			dataset.push(insightData);
		}));

		return Promise.resolve(dataset);
	}

	public async performQuery(query: unknown): Promise<InsightResult[]> {
		if (!isValidQuery(query)) {
			throw new InsightError("performQuery: Not a valid query");
		}
		const checkedQuery: Query = query as Query;
		const columnDatasetIds = checkedQuery.OPTIONS.COLUMNS
			.filter((column) => column.includes("_")) // Ensure the column references a dataset
			.map((column) => getKeyId(column, true)); // Extract dataset ID

		// Ensure all extracted IDs are the same, as we cannot mix datasets in a single query
		const datasetIds = [...new Set(columnDatasetIds)];
		if (datasetIds.length !== 1 || !this.datasetCache[datasetIds[0]]) {
			throw new InsightError("performQuery: incorrect multiple datasets in query or no dataset");
		}
		const id = datasetIds[0];
		const data = this.datasetCache[id];

		// Handles where and options to return array result
		const whereResult = await handleWhere(data, checkedQuery);
		const optionsResult = await handleOptions(whereResult, checkedQuery.OPTIONS);
		const queryResult = optionsResult.flat(); // .flat() will concatenate all the arrays into a single array

		if (queryResult.length > 5000) {
			throw new ResultTooLargeError("performQuery: number of results greater > 5000");
		}

		return Promise.resolve(queryResult);
	}
}
