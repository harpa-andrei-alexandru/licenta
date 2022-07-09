import React from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserFriends,
  faCommentAlt,
  faUserCircle
} from "@fortawesome/free-solid-svg-icons";

import "./CallPageHeader.scss";

const CallPageHeader = () => {
  const getTime = () => {
    var today = new Date(),
 
    curTime = today.getHours() + ':' + today.getMinutes();
 
 
    return curTime;
  };
  return (
    <div className="frame-header">
      <div className="header-items icon-block">
        <FontAwesomeIcon className="icon" icon={faUserFriends}/>
      </div>
      <div className="header-items icon-block">
        <FontAwesomeIcon className="icon" icon={faCommentAlt}/>
        <span className="alert-circle-icon"></span>
      </div>
      <div className="header-items date-block">
        {getTime()}
      </div>
      <div className="header-items icon-block">
        <FontAwesomeIcon className="icon profile" icon={faUserCircle}/>
      </div>
    </div>
  );
}

export default CallPageHeader