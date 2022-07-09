import React from 'react';
import { useRef, useEffect } from 'react';
import styled from "styled-components";
import {UserWithoutCamera, UserIconContainer, UsernameContainer, MicrophoneContainer} from '../CallPage';
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
    height: auto;
    ${props => {
        if(props.presenting){
            return "z-index: 3;"
        }
    }}
`;


export const InnerGridContainer = styled.div`
    ${props => props.hide ? "display: flex" : 'display: none !important'};
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

    ${props => {
        if((props.idx === 2 && props.users === 3) || (props.idx === 5 && props.users === 6))
            return "grid-column: span 3;"
        else if((props.idx === 2 && props.users === 4) || (props.idx === 5 && props.users === 7))
            return "grid-column: 1 / span 1.5;"
    }}
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
        <InnerGridContainer users={props.users} hide={props.hide} presenting={props.peer.presenting} idx={props.idx}>
            <StyledVideo users={props.users} playsInline ref={ref} presenting={props.peer.presenting} autoPlay="autoPlay"/>
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
