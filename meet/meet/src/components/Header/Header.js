import React from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faSignOut
} from "@fortawesome/free-solid-svg-icons";
import "./Header.scss";
import logo from './icon.png';

const Header = ({doLogout}) => {
  return (
    <div className="header">
        <div className="logo">
            <img src={logo}/>
            <span className="app-name">
                MyClassRoom
            </span>
        </div>
        <div className="action-btn">
            <FontAwesomeIcon className="sign-out" icon={faSignOut} onClick={doLogout} />
        </div>
    </div>
  )
}

export default Header