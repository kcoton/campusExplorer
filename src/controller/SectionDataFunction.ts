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
import InsightFacade from "./InsightFacade";

export async function addSection(id: string, content: string, insightFacade: InsightFacade): Promise<string[]> {
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

        insightFacade.datasetCache[id] = datasetList;
        return Promise.resolve(Object.keys(insightFacade.datasetCache));
    } catch (error) {
        return Promise.reject("Error while adding new dataset!");
    }
}