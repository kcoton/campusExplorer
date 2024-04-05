
import './App.css';
import MapComponent from './MapComponent';
import { RoomInsights } from './RoomInsights';
import Box from '@mui/material/Box';

function App() {
  return (
    <div className="App">
      <h1>CAMPUS EXPLORER</h1>
      <RoomInsights />
      <Box height={100}></Box>
      <MapComponent />
    </div>
  );
}

export default App;
