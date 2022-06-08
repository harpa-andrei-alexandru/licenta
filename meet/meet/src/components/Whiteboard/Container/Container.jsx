import React from 'react';
import { useRef, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './style.css';
import Board from '../Board/Board';
import Whiteboard from '../Board/Whiteboard';
import io from 'socket.io-client';


const Container = () => {
    const colorRef = useRef("#000000");
    const sizeRef = useRef();
    const [color, setColor] = useState("#000000");
    const [size, setSize] = useState(5);
    const socket = io("http://localhost:5000/");
    const {id} = useParams();

    useEffect(() => {
        socket.emit("whiteboard-created")
    })
    return (
        <div className='container'>
            <div className='boardContainer'>
                {/* <Board color={colorRef.current.value} size={sizeRef.current.value}/> */}
                <Whiteboard socket={socket} roomId={id}/>
            </div>
        </div>
    );
}

export default Container;