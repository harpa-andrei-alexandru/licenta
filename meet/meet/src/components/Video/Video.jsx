import React from 'react';
import { useRef, useEffect } from 'react';
import styled from "styled-components";
import {UserWithoutCamera, UserIconContainer, UsernameContainer, MicrophoneContainer} from '../Pages/CallPage/CallPage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faUser,
    faMicrophoneSlash
} from '@fortawesome/free-solid-svg-icons';

export const StyledVideo = styled.video`
    border-radius: 20px;
    border: 4px solid brown;
    width: ${props => {
        if(props.presenting){
            return "75vw";
        }
        else if(props.users === 0) {
            return "100vh";
        } else if(props.users === 1) {
            return "75vh";
        } else if(props.users === 2 || (props.users > 2 && props.users <= 5)) {
            return "45vh";
        }
    }};

    margin-right: ${props => props.presenting ? "1vh" : "0vh"};
    height: auto;
`;


export const InnerGridContainer = styled.div`
    display: ${props => props.hide ? "flex" : 'none !important'};
    align-items: center;
    justify-content: center;
    width: 100%;
    height: ${props => {
        if(props.users / 3 < 1 || props.presenting)
            return "90.65vh";
        else if(props.users / 3 < 2)
            return `${90.65/2}vh`;
        else
            return `${90.65/3}vh`;
    }};
    margin-right: ${props => props.presenting ? "2vw" : "0vw"};
    flex: 1;
`

const Video = (props) => {
    const ref = useRef();

    useEffect(() => {
            props.peer.peer.on("stream", stream => {
                ref.current.srcObject = stream;
            })
    }, []);

    return (
        <InnerGridContainer users={props.users} hide={props.hide} presenting={props.peer.presenting}>
            <StyledVideo users={props.users} playsInline autoPlay ref={ref} presenting={props.peer.presenting}/>
            {!props.peer.video && 
            <UserWithoutCamera users={props.users}>
                <UserIconContainer>
                    <FontAwesomeIcon className="user-icon" icon={faUser}/>
                </UserIconContainer>
                <UsernameContainer>{props.peer.username}</UsernameContainer>
            </UserWithoutCamera>}
            {!props.peer.audio && 
            <MicrophoneContainer users={props.users}>
                <FontAwesomeIcon className="user-icon-microphone" icon={faMicrophoneSlash}/>
            </MicrophoneContainer>}
        </InnerGridContainer>
        
    );
}

export default Video;
