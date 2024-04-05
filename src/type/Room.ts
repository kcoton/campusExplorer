export interface Room {
	fullname: string | null; // full building name
	shortname: string | null; // short building name
	number: string | null; // room number
	name: string | null; // room id (rooms_shortname + _ + rooms_number)
	address: string | null; // building address
	lat: number | null; // lat of the building
	lon: number | null; // lon of building
	seats: number | null; // number of seats
	type: string | null; // room type
	furniture: string | null; // room furniture
	href: string | null; // link to full details onl
}

export interface BuildingList {
	[key: string]: Building[];
}

export interface Building {
	fullname: string | null,
	shortname: string | null,
	address: string | null,
	lat: number | null,
	lon: number | null,
	href: string | null // link to the file to get the rooms for the building
}

export interface GeoResponse {
	lat?: number;
	lon?: number;
	error?: string;
}
