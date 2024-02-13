import JSZip from "jszip";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, InsightResult} from "./IInsightFacade";
import {Section} from "../type/Section";
import fs from "fs-extra";
import path from "path";
import {isValidId} from "../utils";
/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	constructor() {
		console.log("InsightFacadeImpl::init()");
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		// Check if an id is valid
		if (!isValidId(id)) {
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
							datasetList.push({
								uuid: id + course.split("/").pop() + datasetList.length.toString(),
								id: id + course.split("/").pop(),
								title: section.Title,
								instructor: section.Professor,
								dept: section.Subject,
								year: parseInt(section.Year, 10),
								avg: section.Avg,
								pass: section.Pass,
								fail: section.Fail,
								audit: section.Audit
							});
						}
					}
				});
			}));

			// write the new array into a file for storage
			console.log(datasetList.length);
			const filePath = path.join(__dirname, "../../data/", `${id}.json`);
			fs.outputJson(filePath, JSON.stringify(datasetList, null, 2))
				.then(() => {
					console.log("success addDataset write!");
				}).catch((err) => {
					console.log(err);
				});
		} catch (error) {
			return Promise.reject("Error while adding Dataset!");
		}
		return Promise.reject("Not done implemented");
	}

	public async removeDataset(id: string): Promise<string> {
		return Promise.reject("Not implemented.");
	}

	public async performQuery(query: unknown): Promise<InsightResult[]> {
		return Promise.reject("Not implemented.");
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		return Promise.reject("Not implemented.");
	}
}
