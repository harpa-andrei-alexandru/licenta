import React from 'react';
import { useRef, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import './CallPage.scss';
import styled from "styled-components";
import io from 'socket.io-client';
import Peer from "simple-peer";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faUser,
    faMicrophoneSlash
} from '@fortawesome/free-solid-svg-icons';

import CallPageFooter from '../../UI/CallPageFooter/CallPageFooter';
import Messenger from '../../UI/Messenger/Messenger';
import Video from '../../Video/Video';
import { StyledVideo } from '../../Video/Video';
import {InnerGridContainer} from '../../Video/Video';


const shareScreenConstraints = {
    height: 1100,
    width: 1500
};

const CallPage = () => {
    const [peers, setPeers] = useState([]);
    const [videoSwitch, setVideoSwitch] = useState(true);
    const [audioSwitch, setAudioSwitch] = useState(true);
    const [messagesSwitch, setMessagesSwitch] = useState(false);
    const [screenShareSwitch, setScreenShareSwitch] = useState(false);
    const [presenting, setPresenting] = useState(false);
    const [currentPresentation, setCurrentPresentation] = useState('');

    const presentingRef = useRef(false);
    const screenTrackRef = useRef();
    const userVideoAudio = useRef();
    const userStream = useRef();
    const peersRef = useRef([]);
    const socket = useRef();
    
    const {roomID} = useParams();
    const navigate = useNavigate();

    const username = window.sessionStorage.getItem("username");
    console.log(peers);
    // if(!socket.current) window.location.reload();
    useEffect(() => {
        if(window.sessionStorage.getItem("logged") !== "success")
            navigate("/");
        socket.current = io("http://localhost:5000/");
        navigator.mediaDevices
            .getUserMedia({ video: true, audio: true })
            .then(stream => {
                userVideoAudio.current.srcObject = stream;
                userStream.current = stream;
                socket.current.emit("join", {username: username, roomID: roomID});

                socket.current.on("users-in-room", users => {
                    const peersInRoom = [];
                    users.forEach(user => {
                        if(username !== user.username) {
                        const peer = createPeer(user.socketID, socket.current.id, stream);
                        const peerObj = {
                            peer,
                            username: user.username,
                            peerId: user.socketID,
                            presenting: false,
                            video: user.video,
                            audio: user.audio
                        };
                        peersRef.current.push(peerObj);
                        peersInRoom.push(peerObj);
                    }
                    });
                    setPeers(peersInRoom);
                });

                socket.current.on("incoming-call", ({ signal, callerId, info }) => {
                    const {username} = info;
                    const user = peersRef.current.find(peer => peer.username === username);
                    const peer = addPeer(signal, callerId, stream);
                    const peerObj = {
                        peer,
                        username: username,
                        peerId: callerId,
                        presenting: false,
                        video: true,
                        audio: true
                    }

                    if(!user) {
                        peersRef.current.push(peerObj)
                        setPeers(users => {
                            let inRoom = false;
                            for(let i = 0; i < users.length; ++i) {
                                if(users[i].username === peerObj.username) {
                                    inRoom = true;
                                    break;
                                }
                            }
                            if(!inRoom)
                                return [...users, peerObj]
                            else return [...users];
                        });
                    } else {
                        let users = [];
                        for(let i = 0; i < peersRef.current.length; i++) {
                            if(peersRef.current[i].username !== username)
                                users.push(peersRef.current[i]);
                        }
                        users.push(peerObj);
                        setPeers(users);
                        peersRef.current = users; 
                    }
                });

                socket.current.on("call-was-accepted", ({ signal, id }) => {
                    const user = peersRef.current.find(peer => peer.peerId === id);
                    user.peer.signal(signal);
                });

                socket.current.on("user-left", (username) => {
                    const peerObj = peersRef.current.find(p => p.username === username);

                    if(peerObj) peerObj.peer.destroy();

                    const peersInRoom = peersRef.current.filter(p => p.username !== username);
                    peersRef.current = peersInRoom;
                    setPeers(peersInRoom);
                });

                socket.current.on("start-presenting", ({username}) => {
                    const peersCopy = [...peersRef.current];
                    peersCopy.forEach((peer) =>{
                        if(peer.username === username) {
                            peer.presenting = true;
                        }
                    });
                    peersRef.current = peersCopy;
                    if(currentPresentation === '')
                        setCurrentPresentation(username);
                    setPeers(peersCopy);
                });

                socket.current.on("stop-presenting", ({userName}) => {
                    const peersCopy = [...peersRef.current];
                    peersCopy.forEach((peer) =>{
                        if(peer.username === userName) {
                            peer.presenting = false;
                        }
                    });
                    peersRef.current = peersCopy;
                    let user = '';
                    for(let i = 0; i < peersCopy.length; i++) {
                        if(peersCopy[i].presenting === true){
                            user = peersCopy[i].username;
                            break;
                        }
                    }
                    if(user === '' && presentingRef.current === true)
                        setCurrentPresentation(username);
                    else
                        setCurrentPresentation(user)
                    setPeers(peersCopy);
                });

                socket.current.on('camera-switch', ({username, value}) => {
                    const peersCopy = [...peersRef.current];
                    peersCopy.forEach((peer) =>{
                        if(peer.username === username) {
                            peer.video = value;
                        }
                    });
                    peersRef.current = peersCopy;
                    setPeers(peersCopy);
                });

                socket.current.on('microphone-switch', ({username, value}) => {
                    const peersCopy = [...peersRef.current];
                    peersCopy.forEach((peer) =>{
                        if(peer.username === username) {
                            peer.audio = value;
                        }
                    });
                    peersRef.current = peersCopy;
                    setPeers(peersCopy);
                });
            });

            return () => {
                socket.current.disconnect();
            }
    }, []);

    function createPeer(userToCall, callerId, stream) {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream,
        });

        peer.on("signal", signal => {
            socket.current.emit("call-user", { userToCall, callerId, signal, roomID });
        });

        peer.on('disconnect', () => {
            peer.destroy();
        })

        return peer;
    }

    function addPeer(incomingSignal, callerId, stream) {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream,
        })

        peer.on("signal", signal => {
            socket.current.emit("call-accepted", { signal, callerId, username, roomID })
        })

        peer.on('disconnect', () => {
            peer.destroy();
        })

        peer.signal(incomingSignal);

        return peer;
    }

    const toggleCamera = (value) => {
        userVideoAudio.current.srcObject.getVideoTracks()[0].enabled = value;
        socket.current.emit("camera-switch", {username, roomID, value});
        setVideoSwitch(value);
    }

    const toggleAudio = (value) => {
        userVideoAudio.current.srcObject.getAudioTracks()[0].enabled = value;
        socket.current.emit("microphone-switch", {username, roomID, value});
        setAudioSwitch(value);
    }

    const toggleMessages = (value) => {
        setMessagesSwitch(value);
    }

    const selectPresentation = (username) => {
        setCurrentPresentation(username);
    }

    const leaveRoom = () => {
        userVideoAudio.current.srcObject.getVideoTracks()[0].stop();
        userVideoAudio.current.srcObject.getAudioTracks()[0].stop();
        socket.current.emit("leave-room", {username, roomID});
        navigate("/home");
    }

    const shareScreen = () => {

        if(!screenShareSwitch) {
            navigator.mediaDevices.getDisplayMedia({ video: true, cursor: true}).then(stream => {
                const screenTrack = stream.getTracks()[0];
                
                peersRef.current.forEach(({ peer }) => {
                    peer.replaceTrack(
                    peer.streams[0]
                        .getTracks()
                        .find((track) => track.kind === 'video'), screenTrack, userStream.current);
                });


                screenTrack.onended = () => {
                    peersRef.current.forEach(({ peer }) => {
                      peer.replaceTrack(
                        screenTrack,
                        peer.streams[0]
                          .getTracks()
                          .find((track) => track.kind === 'video'),
                        userStream.current
                      );
                    });
                    userVideoAudio.current.srcObject = userStream.current;
                    socket.current.emit("stop-presenting", {username, roomId: roomID});
                    let user = ''
                    for(let i = 0; i < peersRef.current.length; ++i) {
                        if(peersRef.current[i].presenting === true) {
                            user = peersRef.current[i].username;
                            break;
                        }
                    }
                    presentingRef.current = false;
                    setCurrentPresentation(user);
                    setScreenShareSwitch(false);
                    setPresenting(false);
                };

                userVideoAudio.current.srcObject = stream;
                screenTrackRef.current = screenTrack;
                socket.current.emit("start-presenting", {username, roomId: roomID});
                presentingRef.current = true;
                setCurrentPresentation(username);
                setScreenShareSwitch(true);
                setPresenting(true);
            })
        } else {
            screenTrackRef.current.onended();
        }
    }

    const checkIfIsPresenting = () => {
        for(let i = 0; i < peersRef.current.length; ++i) {
            if(peersRef.current[i].presenting) return true;
        }

        return false;
    }

    return (
        <RoomContainer>
            <VideoContainer users={peers.length}>
                        <InnerGridContainer users={peers.length} hide={(presenting && currentPresentation === username) || (!presenting && !checkIfIsPresenting())} presenting={presenting}>
                            <StyledVideo users={peers.length} muted ref={userVideoAudio} autoPlay playsInline presenting={presenting}/>
                            {!videoSwitch && 
                            <UserWithoutCamera users={peers.length}>
                                <UserIconContainer>
                                    <FontAwesomeIcon className="user-icon" icon={faUser}/>
                                </UserIconContainer>
                                <UsernameContainer>{username}</UsernameContainer>
                            </UserWithoutCamera>}
                            {!audioSwitch && 
                            <MicrophoneContainer users={peers.length}>
                                <FontAwesomeIcon className="user-icon-microphone" icon={faMicrophoneSlash}/>
                            </MicrophoneContainer>}
                        </InnerGridContainer>
                        
                    {peers.map((peer, idx) => {
                        return (
                            <Video users={peers.length} 
                                   key={peer.peerId} 
                                   peer={peer} 
                                   hide={(peer.presenting && currentPresentation === peer.username) || (!presenting && !checkIfIsPresenting())}/>
                        );
                    })}
            </VideoContainer>
            
            <Messenger 
                roomID={roomID} 
                toggleMessages={toggleMessages}  
                messagesSwitch={messagesSwitch}
                people={peers}
                selectPresentation={selectPresentation}
                currentUsername={username}
                currentVideo={videoSwitch}
                currentAudio={audioSwitch}
                currentPresenting={presenting}
            />
            <CallPageFooter 
                toggleShareScreen={shareScreen}
                toggleCamera={toggleCamera} 
                toggleAudio={toggleAudio}
                toggleMessages={toggleMessages}  
                videoSwitch={videoSwitch} 
                audioSwitch={audioSwitch}
                messagesSwitch={messagesSwitch}
                screenShareSwitch={screenShareSwitch}
                leaveRoom={leaveRoom}
                roomId={roomID}
                socket={socket.current}/>
        </RoomContainer>
    );
}

const RoomContainer = styled.div`
    width: 100vw;
    height: 90.65vh;
    max-height: 100vh;
    display: flex;
    flex-direction: row;
    background: rgba(248,237,207,255);
`;


const VideoContainer = styled.div`
    height: 100%;
    grid-template-columns: ${props => {
        if(props.users === 0)
            return "repeat(1, 1fr)";
        else if(props.users === 1)
            return "repeat(2, 1fr)";
        else
            return "repeat(3, 1fr)"
    }};
    grid-template-rows: ${props => {
        if(props.users / 3 === 0)
            return "repeat(1, 1fr)";
        else if(props.users / 3 === 2)
            return "repeat(2, 1fr)";
        else
            return "repeat(3, 1fr)"
    }};
    width: 100%;
    display: grid;
`;


export const UserWithoutCamera = styled.div`
    position: absolute;
    border-radius: 20px;
    border: 4px solid brown;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    background: #313131;
    width: ${props => {
        if(props.users === 0) {
            return "100vh";
        } else if(props.users === 1) {
            return "75vh";
        } else if(props.users === 2 || (props.users > 2 && props.users <= 5)) {
            return "45vh";
        }
    }};
    height: ${props => {
        if(props.users === 0) {
            return "75vh";
        } else if(props.users === 1) {
            return "56.25vh";
        } else if(props.users === 2 || (props.users > 2 && props.users <= 5)) {
            return "33.75vh";
        }
    }};
    z-index: 1;
`;

export const UserIconContainer = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 130px;
    height: 130px;
    border-radius: 50%;
    border: 4px solid white;
`
export const UsernameContainer = styled.div`
    margin-top: 10px;
    color: white;
    font-size: 30px;
    font-weight: 500;
`

export const MicrophoneContainer = styled.div`
    .user-icon-microphone {
        width: 25px;
        height: 25px;
        color: gold;
        margin-left: 1%;
        margin-top: 1%;
    }
    position: absolute;
    z-index: 2;
    display: flex;
    width: ${props => {
        if(props.users === 0) {
            return "100vh";
        } else if(props.users === 1) {
            return "75vh";
        } else if(props.users === 2 || (props.users > 2 && props.users <= 5)) {
            return "45vh";
        }
    }};
    height: ${props => {
        if(props.users === 0) {
            return "75vh";
        } else if(props.users === 1) {
            return "56.25vh";
        } else if(props.users === 2 || (props.users > 2 && props.users <= 5)) {
            return "33.75vh";
        }
    }};
`
export default CallPage