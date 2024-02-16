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
import {Query, isValidQuery} from "./PerformQueryHelper";
import {handleWhere} from "./PerformQueryWhere";
import {handleOptions} from "./PerformQueryOptions";

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
								uuid: section.id.toString(),
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

			this.datasetCache[id] = datasetList;
			return Promise.resolve(Object.keys(this.datasetCache));
		} catch (error) {
			return Promise.reject("Error while adding new dataset!");
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

		// Gets datasetId from the query
		const id = (query as Query).OPTIONS.COLUMNS[0].split("_")[0];
		const data = this.datasetCache[id];

		// Handles where and options to return array result
		const whereResult = await handleWhere(data, query as Query);
		const optionsResult = await handleOptions(whereResult, (query as Query).OPTIONS);
		const queryResult = optionsResult.flat(); // .flat() will concatenate all the arrays into a single array

		if (queryResult.length > 5000) {
			throw new ResultTooLargeError("performQuery: number of results greater > 5000");
		}

		return Promise.resolve(queryResult);
	}
}
