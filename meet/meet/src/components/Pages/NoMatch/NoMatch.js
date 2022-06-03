import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../../UI/Header';

import './NoMatch.scss';

const NoMatch = () => {
  return (
    <div className="no-match">
      <Header/>
      <div className="no-match-content">
        <h2>Invalid video call name</h2>
        <div className="action-btn">
          <Link className="btn green" to="/">
            Return to home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default NoMatch