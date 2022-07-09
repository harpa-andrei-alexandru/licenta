import React from 'react';
import './HomePage.scss';
import Header from '../../Header/Header';
import {v1 as uuid} from 'uuid';

import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVideo, faKeyboard } from '@fortawesome/free-solid-svg-icons';
import io from 'socket.io-client';

toast.configure();
const HomePage = () => {
  const roomID = useRef();
  const socketRef = useRef();
  const navigate = useNavigate();

  
  useEffect(() => {
    if(window.sessionStorage.getItem("logged") !== "success")
      navigate("/");
    socketRef.current = io("http://localhost:5000/");
    socketRef.current.on("res-check-room", (exists) => {
      if(exists === true)
        navigate(`/${roomID.current.value}`);
      else { 
        toast.warning(`There is no room with id: ${roomID.current.value}`, {position: toast.POSITION.TOP_CENTER});
      }
    });

    return () => {
      socketRef.current.disconnect();
    }
  }, []);

  const createRoom = () => {
    const id = uuid();
    navigate(`/${id}`);
  }

  const joinClassroom = () => {
    if(roomID.current.value === "")
      toast.warning('Please insert a room id!', {position: toast.POSITION.TOP_CENTER});
    else {
      socketRef.current.emit("check-room", {roomID : roomID.current.value});
    }
  }

  const doLogout = () => {
    window.sessionStorage.clear();
    navigate("/");
  }

  return (
    <div className="home-page">
        <Header doLogout={doLogout}/>
        <div className="body">
          <div className="content">
            <h2>
              Free classroom meetings.
            </h2>
            <div className="action-btn">
              <button className="btn green" onClick={createRoom}>
                <FontAwesomeIcon className="icon-block" icon={faVideo}/>
                New Meeting
              </button>
              <div className="input-block">
                <div className="input-section">
                  <FontAwesomeIcon className="icon-block" icon={faKeyboard}/>
                  <input placeholder="Enter a room id" ref={roomID}/>
                </div>
                <button className="btn no-bg" onClick={joinClassroom}>Join</button>
              </div>
            </div>
          </div>
        </div>
    </div>
  )
}

export default HomePage