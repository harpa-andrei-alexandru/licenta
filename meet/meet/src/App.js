import { BrowserRouter as Router, Routes, Route} from 'react-router-dom';
import './App.scss';

import { useState, useMemo } from "react";

import LoginPage from "./components/Pages/LoginPage/LoginPage";
import CallPage from './components/Pages/CallPage/CallPage';
import HomePage from './components/Pages/HomePage/HomePage';
import NoMatch from './components/Pages/NoMatch/NoMatch';
import Container from './components/Whiteboard/Container/Container';

function App() {
  return (
    <Router>
        <Routes>
            <Route path="/" exact element={<LoginPage/>}/>
            <Route exact path="/:roomID" element={<CallPage/>}/>
            <Route path="/home" exact element={<HomePage/>}/>
            <Route path="*" element={<NoMatch/>}/>
            <Route path="/:id/whiteboard" element={<Container/>}/>
        </Routes>
    </Router>
  );
}

export default App;
