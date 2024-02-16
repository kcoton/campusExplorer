export interface Section {
	uuid: string; // id
	id: string; // course
	title: string;
	instructor: string; // professor
	dept: string; // subject
	year: number;
	avg: number;
	pass: number;
	fail: number;
	audit: number;
}

export interface Dataset {
	[key: string]: Section[];
}
