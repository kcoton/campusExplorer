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
import {isValidId} from "../utils";
import {Query, isValidQuery} from "./PerformQueryHelper";
import {handleWhere} from "./PerformQueryWhere";
import {handleOptions} from "./PerformQueryOptions";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	public datasetIds: Set<string>; // array of ids to be returned
	public datasetCache: Dataset; // array of all sections with id key

	constructor() {
		this.datasetIds = new Set();
		this.datasetCache = {};
		console.log("InsightFacadeImpl::init()");
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		if (!isValidId(id) || this.datasetIds.has(id)) {
			return Promise.reject(new InsightError("ID is invalid!"));
		}

		try {
			let datasetList: Section[] = [];
			let jszip = new JSZip();
			const zip = await jszip.loadAsync(content, {base64: true});
			let courses = Object.keys(zip.files);

			await Promise.all(courses.map(async (course) => {
				if (!course.startsWith("courses/")) {
					return Promise.reject(new InsightError("Zip files do not start with courses/"));
				}

				await zip.file(course)?.async("string").then((fileContent) => {
					const jsonContent = JSON.parse(fileContent);
					if (jsonContent.result && jsonContent.result.length > 0) {
						for (let section of jsonContent.result) {
							const formattedSection: Section = {
								uuid: id,
								id: section.Course,
								title: section.Title,
								instructor: section.Professor,
								dept: section.Subject,
								year: section.Section === "overall" ? 1900 : parseInt(section.Year, 10),
								avg: section.Avg,
								pass: section.Pass,
								fail: section.Fail,
								audit: section.Audit
							};
							datasetList.push(formattedSection);
						}
					}
				});
			}));


			if (datasetList.length === 0) {
				return Promise.reject(new InsightError("No valid section inside the dataset!"));
			}

			const filePath = path.join(__dirname, "../../data/", `${id}.json`);
			await fs.outputJson(filePath, JSON.stringify(datasetList, null, 2));

			this.datasetIds.add(id);
			this.datasetCache[id] = datasetList;
			return Promise.resolve(Array.from(this.datasetIds));
		} catch (error) {
			return Promise.reject("Error while adding new dataset!");
		}
	}

	public async removeDataset(id: string): Promise<string> {
		if (!isValidId(id)) {
			return Promise.reject(new InsightError("Invalid ID!"));
		}
		if (!this.datasetIds.has(id)) {
			return Promise.reject(new NotFoundError("ID does not exist: never added in the first place!"));
		}

		// delete the associated file of the dataset and delete id from datasetIds
		try {
			const filePath = path.join(__dirname, "../../data/", `${id}.json`);
			await fs.remove(filePath);
			this.datasetIds.delete(id);
			this.datasetCache[id].pop();

			console.log("delete success!");
			return Promise.resolve(id);
		} catch (err) {
			console.error(err);
			return Promise.reject(new InsightError("An error occurred while trying to remove"));
		}
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		let dataset: InsightDataset[] = [];

		await Promise.all(Array.from(this.datasetIds).map(async (id) => {
			const filePath = path.join(__dirname, "../../data/", `${id}.json`);
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
		if (!isValidQuery(query as Query)) {
			throw new InsightError("performQuery: Not a valid query");
		}

		// Create an array of promises for each id in the datasetCache
		const results = await Promise.all(Object.keys(this.datasetCache).map(async (id) => {
			const data = this.datasetCache[id];
			const whereResult = await handleWhere(data, query as Query);
			const optionsResult = await handleOptions(whereResult, (query as Query).OPTIONS);
			return optionsResult;
		}));

		const queryResult = results.flat(); // .flat() will concatenate all the arrays into a single array

		if (queryResult.length > 5000) {
			throw new ResultTooLargeError("performQuery: number of results greater > 5000");
		}

		return Promise.resolve(queryResult);
	}
}
