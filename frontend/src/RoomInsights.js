import React, { useState, useEffect } from "react"
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';

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
            <p>ROOM INSIGHTS</p>
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
              sx={{ width: '500px' }}
            />
            {/* <Button variant="contained" onClick={handleChooseButton}>Choose Rooms</Button> */}

            <Box sx={{ width: '100%' }}>
              <Stack spacing={2}>
              {chosenRooms.map(room => (
                <RoomInfo room={room} chosenRooms={chosenRooms} />
              ))}
              </Stack>
            </Box>
        </div>
    )
}

const RoomInfo = (props) => {
  const room = props.room;

  return (
    <Box sx={{ border: '2px solid grey' }}>
      <p><strong>Fullname:</strong> {room.fullname}</p>
      <p><strong>Shortname:</strong> {room.shortname}</p>
      <p><strong>Number:</strong> {room.number}</p>
      <p><strong>Name:</strong> {room.name}</p>
      <p><strong>Address:</strong> {room.address}</p>
      <p><strong>Seats:</strong> {room.seats}</p>
    </Box>
  )
}
