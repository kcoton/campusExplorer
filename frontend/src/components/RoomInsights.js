import React, { useState, useEffect } from "react"

export const RoomInsights = () => {
    const [rooms, setRooms] = useState([{
        fullname: 'School of Population and Public Health',
        shortname: 'SPPH',
        number: '143',
        name: 'SPPH_143',
        address: '2206 East Mall',
        lat: 49.2642,
        lon: -123.24842,
        seats: 28,
        type: 'Small Group',
        furniture: 'Classroom-Fixed Tables/Movable Chairs',
        href: 'http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/SPPH-143'
      },
      {
        fullname: 'School of Population and Public Health',
        shortname: 'SPPH',
        number: 'B108',
        name: 'SPPH_B108',
        address: '2206 East Mall',
        lat: 49.2642,
        lon: -123.24842,
        seats: 30,
        type: 'Small Group',
        furniture: 'Classroom-Fixed Tables/Movable Chairs',
        href: 'http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/SPPH-B108'
      },
      {
        fullname: 'School of Population and Public Health',
        shortname: 'SPPH',
        number: 'B112',
        name: 'SPPH_B112',
        address: '2206 East Mall',
        lat: 49.2642,
        lon: -123.24842,
        seats: 16,
        type: 'Small Group',
        furniture: 'Classroom-Movable Tables & Chairs',
        href: 'http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/SPPH-B112'
      },
      {
        fullname: 'School of Population and Public Health',
        shortname: 'SPPH',
        number: 'B136',
        name: 'SPPH_B136',
        address: '2206 East Mall',
        lat: 49.2642,
        lon: -123.24842,
        seats: 12,
        type: 'Small Group',
        furniture: 'Classroom-Movable Tables & Chairs',
        href: 'http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/SPPH-B136'
      },
      {
        fullname: 'School of Population and Public Health',
        shortname: 'SPPH',
        number: 'B138',
        name: 'SPPH_B138',
        address: '2206 East Mall',
        lat: 49.2642,
        lon: -123.24842,
        seats: 14,
        type: 'Small Group',
        furniture: 'Classroom-Movable Tables & Chairs',
        href: 'http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/SPPH-B138'
      }]);

    return (
        <div>
            <p>ROOM INSIGHTS</p>
        </div>
    )
}