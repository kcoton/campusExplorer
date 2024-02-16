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
