import React from 'react';
import { useParams } from 'react-router-dom';
import './Container.css';
import Whiteboard from '../Board/Whiteboard';

const Container = () => {
    const {id} = useParams();

    return (
        <div className='container'>
            <div className='boardContainer'>
                <Whiteboard roomId={id}/>
            </div>
        </div>
    );
}

export default Container;