import {APIProvider, Map, Marker, InfoWindow} from '@vis.gl/react-google-maps';
import React, {useEffect, useState} from 'react';
import './MapComponent.css';

const API_KEY = "AIzaSyDr-jyCygNQXCo1hso5_OKMaINxQ_rvI_c";
const SERVER_URL = "http://localhost:4321";

function MapComponent() {
	const [buildings, setBuildings] = useState(null);
	const [buildingsList, setBuildingsList] = useState(null);
	const [selectedBuilding, setSelectedBuilding] = useState(null);

	useEffect(() => {
		fetch(`${SERVER_URL}/buildings`)
			.then(response => response.json())
			.then(data => setBuildingsList(data.result))
			.catch(error => console.error('MapComponent GET /buildings error:', error));
	  }, []);

	const handleSelectChange = (event) => {
		const selectedKey = event.target.value;
		setBuildings(buildingsList[selectedKey]);
	}

	return (
	<APIProvider apiKey={API_KEY}>
		<div className="select-container">
			<select className="select-building" onChange={handleSelectChange}>
				<option value="">Select a dataset</option>
				{Object.keys(buildingsList || {}).map((key, index) => (
					<option key={index} value={key}>
						{key}
					</option>
				))}
			</select>
		</div>

		<Map
			style={{width: 'auto', height: '90vh'}}
			defaultCenter={{ lat: 49.26408, lng: -123.24605 }}
			defaultZoom={16}
			gestureHandling={'greedy'}
			disableDefaultUI={false}
		>
			{buildings ? (
				buildings.map((building, index) => (
					<>
						<Marker
							key={index}
							position={{ lat: building.lat, lng: building.lon }}
							onClick={() => {
								setSelectedBuilding(building);
							}}
						/>
					{selectedBuilding && (
						<InfoWindow
							position={{ lat: selectedBuilding.lat, lng: selectedBuilding.lon }}
							onCloseClick={() => {
								setSelectedBuilding(null);
							}}
						>
							<div>
								<h2>{selectedBuilding.fullname} ({selectedBuilding.shortname})</h2>
								<p>{selectedBuilding.address}</p>
							</div>
					</InfoWindow>
				)}
			</>
		))
		) : "loading..."}
		</Map>
	</APIProvider>
	);
}

export default MapComponent;
