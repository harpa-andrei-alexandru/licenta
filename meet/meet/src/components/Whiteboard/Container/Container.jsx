import React from 'react';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './style.css';
import Whiteboard from '../Board/Whiteboard';
import io from 'socket.io-client';


const Container = () => {
    const socket = io("http://localhost:5000/");
    const {id} = useParams();

    useEffect(() => {
        socket.emit("whiteboard-created")
    })
    return (
        <div className='container'>
            <div className='boardContainer'>
                <Whiteboard socket={socket} roomId={id}/>
            </div>
        </div>
    );
}

export default Container;