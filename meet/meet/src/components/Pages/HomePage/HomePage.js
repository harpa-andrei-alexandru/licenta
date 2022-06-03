import React from 'react';
import './HomePage.scss';
import Header from '../../UI/Header';
import {v1 as uuid} from 'uuid';

import { useNavigate } from 'react-router-dom';
import { useEffect, useContext, useRef } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVideo, faKeyboard } from '@fortawesome/free-solid-svg-icons';

import { SocketContext } from "../../Context/SocketContext";

const HomePage = () => {
  const roomID = useRef();
  const socket = useContext(SocketContext);
  const navigate = useNavigate();

  
  useEffect(() => {
    if(window.sessionStorage.getItem("logged") !== "success")
      navigate("/");
    // socket.on("res-check-room", (exists) => {
    //   if(exists === true)
    //     navigate(`/${roomID.current.value}`);
    //   else { 
    //     alert(`There is no room with id: ${roomID.current.value}`);
    //   }
    // });
  }, []);

  const createRoom = () => {
    const id = uuid();
    navigate(`/${id}`);
  }

  const joinClassroom = () => {
    if(roomID.current.value === null)
      alert("Please enter a room id");
    else {
      console.log(roomID.current.value);
      socket.emit("req-check-room", {id: roomID.current.value});
    }
  }

  const doLogout = () => {
    window.sessionStorage.clear();
    navigate("/");
  }

  return (
    <div className="home-page">
        <Header
          doLogout={doLogout}/>
        <div className="body">
          <div className="content">
            <h2>
              Free classroom meetings.
            </h2>
            <p>
              This is just a clone for now.
            </p>
            <div className="action-btn">
              <button className="btn green" onClick={createRoom}>
                <FontAwesomeIcon className="icon-block" icon={faVideo}/>
                New Meeting
              </button>
              <div className="input-block">
                <div className="input-section">
                  <FontAwesomeIcon className="icon-block" icon={faKeyboard}/>
                  <input placeholder="Enter a code or link" ref={roomID}/>
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