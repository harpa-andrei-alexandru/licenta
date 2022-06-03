import React from 'react';
import { useRef, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './style.css';
import Board from '../Board/Board';
import { SocketContext } from '../../Context/SocketContext';
import io from 'socket.io-client';


const Container = () => {
    const colorRef = useRef();
    const sizeRef = useRef();
    const [color, setColor] = useState("#000000");
    const [size, setSize] = useState(5);
    const socket = io("http://localhost:5000/");
    const {roomID} = useParams();

    useEffect(() => {
        console.log(socket);
        // colorRef.current.value = "#000000";
        // sizeRef.current.value = "5";
        console.log(colorRef.current);
        console.log(sizeRef.current);
    })

    const onChangeColor = (e) => {
        setColor(e.target.value);
    }

    return (
        <div className='container'>
            <div className='toolsContainer'>
                <div className='colorPickerContainer'>
                    Select Brush Color: &nbsp;
                    <input ref={colorRef} id='color' type='color'/>
                </div>

                <div className='brushSizeContainer'>
                    Select Brush Size: &nbsp;
                    <select ref={sizeRef}>
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="15">15</option>
                        <option value="20">20</option>
                        <option value="25">25</option>
                        <option value="30">30</option>
                    </select>
                </div>
            </div>
            
            <div className='boardContainer'>
                {/* <Board color={colorRef.current.value} size={sizeRef.current.value}/> */}
                <Board color={colorRef.current.value} size={sizeRef.current} socket={socket} roomID={roomID}/>
            </div>
        </div>
    );
}

export default Container;