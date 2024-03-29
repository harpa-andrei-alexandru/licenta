import React from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faVideo,
  faVideoSlash,
  faMicrophone,
  faPhone,
  faDesktop,
  faMicrophoneSlash,
  faChalkboard,
  faMessage
} from '@fortawesome/free-solid-svg-icons';

import './CallPageFooter.scss';

const CallPageFooter = ({
  toggleShareScreen,
  toggleCamera, 
  toggleAudio,
  toggleMessages, 
  videoSwitch, 
  audioSwitch,
  messagesSwitch,
  screenShareSwitch,
  leaveRoom,
  roomId,
  presenting}) => {


  const openWhiteboard = (data) => {
    window.open(`http://localhost:3000/${roomId}/whiteboard`);
  }

  return (
    <div className="footer-item">
      <div className="left-item">
        <div className="icon-block">
        </div>
      </div>
      <div className="center-item">
        <div className={`icon-block ${presenting ? "disable" : ""} ${videoSwitch ? "" : "red-bg"}`} onClick={() => {toggleCamera(!videoSwitch);}}>
          <FontAwesomeIcon className="icon" icon={videoSwitch ? faVideo : faVideoSlash} />
        </div>
        <div className={`icon-block ${presenting ? "disable" : ""} ${audioSwitch ? "" : "red-bg"}`} onClick={() => {toggleAudio(!audioSwitch);}}>
            <FontAwesomeIcon className="icon" icon={audioSwitch ? faMicrophone : faMicrophoneSlash}/>
        </div>
        <div className="icon-block" onClick={leaveRoom}>
          <FontAwesomeIcon className="icon red" icon={faPhone}/>
        </div>
        <div className="icon-block" onClick={() => openWhiteboard("mancare")}>
          <FontAwesomeIcon className="icon" icon={faChalkboard}/>
        </div>
      </div>
      <div className="right-item">
        <div className={`icon-block ${!screenShareSwitch ? "" : "red-bg"}`} onClick={() => {toggleShareScreen(!screenShareSwitch);}}>
          <FontAwesomeIcon className="icon" icon={faDesktop}/>
          <p>Present now</p>
        </div>
        <div className={`icon-block ${!messagesSwitch ? "" : "red-bg"}`} onClick={() => {toggleMessages(!messagesSwitch);}}>
          <FontAwesomeIcon className="icon" icon={faMessage}/>
          <p>{messagesSwitch ? "Hide Messages" : "Show Messages"}</p>
        </div>
      </div>
    </div>
  )
}

export default CallPageFooter