export interface Room {
	fullname: string; // full building name
	shortname: string; // short building name
	number: string; // room number
	name: string; // room id (rooms_shortname + _ + rooms_number)
	address: string; // building address
	lat: number; // lat of the building
	lon: number; // lon of building
	seats: number; // number of seats
	type: string; // room type
	furniture: string; // room furniture
	href: string; // link to full details onl
}

export interface Building {
	fullname: string,
	shortname: string,
	address: string,
	lat: number,
	lon: number,
	href: string // link to the file to get the rooms for the building
}

export interface GeoResponse {
	lat?: number;
	lon?: number;
	error?: string;
}
