import React, { useState, useEffect } from "react"
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';

const SERVER_URL = "http://localhost:4321";

export const RoomInsights = () => {
    const [rooms, setRooms] = useState([]);
    const [chosenRooms, setChosenRooms] = useState([]);

    useEffect(() => {
      fetch(`${SERVER_URL}/rooms`)
			.then(response => response.json())
			.then(data => setRooms(data.result))
			.catch(error => console.error('MapComponent GET /rooms error:', error));
    }, []);

    const handleAutocompleteChange = (event, newValue) => {
      console.log(newValue)
      setChosenRooms(newValue);
    }

    return (
        <div>
            <h3 style={{ textAlign: 'left', marginLeft: "30px" }}>ROOM INSIGHTS</h3>
            <Autocomplete
              multiple
              options={rooms}
              getOptionLabel={(option) => option.name}
              getOptionDisabled={(option) => 
                chosenRooms.length === 5
              }
              renderInput={(params) => (
                <TextField {...params} label="pick rooms" placeholder="Pick a room" />
              )}
              onChange={handleAutocompleteChange}
              sx={{ width: '700px' }}
              style={{ marginLeft: '30px'}}
            />
            
            <Box>
              <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3}} style={{ margin: '30px' }}>
                {chosenRooms.map(room => (
                <Grid item style={{ padding: '30px'}}>
                  <RoomInfo room={room} chosenRooms={chosenRooms} />
                </Grid>
                ))}
              </Grid>
            </Box>
        </div>
    )
}

const RoomInfo = (props) => {
  const room = props.room;
  const chosenRooms = props.chosenRooms;
  const [pairings, setPairings] = useState([]); // pairing : {room2, walkingTime}

  useEffect(() => {
    if (chosenRooms.length >= 2) {
      setPairings(prev => {
        const newPairings = [];
        for (const room2 of chosenRooms) {
          if (room2 !== room) {
            const pairing = {
              room2: room2.name,
              walkingTime: calculateWalkingTime(room, room2)
            }
            newPairings.push(pairing);
          }
        }
        return newPairings;
      })
    } else {
      setPairings([]);
    }
  }, [chosenRooms])

  function distanceToMeter(lat1, lon1, lat2, lon2){
    const m = Math.PI / 180;
    const R = 6378.137; // Radius of earth in KM
    const diffLat = lat2 - lat1;
    const diffLon = lon2 - lon1;

    // formula for conversion from gps to m is from stackoverflow
    const a = Math.sin(diffLat * m/2) * Math.sin(diffLat * m/2) +
    Math.cos(lat1 * m) * Math.cos(lat2 * m) *
    Math.sin(diffLon * m/2) * Math.sin(diffLon * m/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c;
    return d * 1000; // meters
  }

  const calculateWalkingTime = (roomA, roomB) => {
    const distance = distanceToMeter(roomA.lat, roomA.lon, roomB.lat, roomB.lon); 
    const avgWalkingSpeed = 1.42 // in m/s
    const walkingTime = distance / avgWalkingSpeed;
    console.log(walkingTime)
    return Math.round(walkingTime / 60) + 3; // convert from secs to mins, plus 3 minutes to walk to stairs..
  }

  return (
    <Box sx={{ border: '2px solid grey' }} style={{padding: '20px'}}>
      <p><strong>Fullname:</strong> {room.fullname}</p>
      <p><strong>Shortname:</strong> {room.shortname}</p>
      <p><strong>Number:</strong> {room.number}</p>
      <p><strong>Name:</strong> {room.name}</p>
      <p><strong>Address:</strong> {room.address}</p>
      <p><strong>Seats:</strong> {room.seats}</p>
      {pairings.map(pairing => 
        (
          <p><strong>Estimated Time to {pairing.room2}: </strong> {pairing.walkingTime} minutes</p>
        ))}
    </Box>
  )
}
