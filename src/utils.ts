import fs from "fs-extra";
import path from "path";

// Takes in the id of a dataset, returns true if the id is valid, false otherwise
export function isValidId(id: string) {
	const regex = /^[^_]+$/;
	if (!regex.test(id)) {
		return false;
	}
	if (id.includes("_") || id.trim().length === 0) {
		return false;
	}
	if (!id) {
		return false;
	}
	return true;
}

// If an ID exists, there there must be a file with such path
export async function checkExistingId(id: string) {
	const filePath = path.join(__dirname, "../data/", `${id}.json`);
	const exists = await fs.pathExists(filePath);
	if (exists) {
		return true;
	}
	return false;
}
