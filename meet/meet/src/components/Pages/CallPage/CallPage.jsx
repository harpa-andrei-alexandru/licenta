import React from 'react';
import { useRef, useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import './CallPage.scss';
import styled from "styled-components";
import io from 'socket.io-client';
import Peer from "simple-peer";

import CallPageFooter from '../../UI/CallPageFooter/CallPageFooter';
import Messenger from '../../UI/Messenger/Messenger';
import Video from '../../Video/Video';
import { StyledVideo } from '../../Video/Video';


const videoConstraints = {
    height: window.innerHeight / 4,
    width: window.innerWidth / 4
};

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
    const screenTrackRef = useRef();
    const userVideoAudio = useRef();
    const userStream = useRef();
    const peersRef = useRef([]);
    const socket = useRef();
    const {roomID} = useParams();
    const navigate = useNavigate();

    const username = window.sessionStorage.getItem("username");
    console.log(username);
  
    
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
                            peerId: user.socketID
                        };
                        peersRef.current.push(peerObj);
                        peersInRoom.push(peerObj);
                    }
                    });
                    setPeers(peersInRoom);
                });

                socket.current.on("incoming-call", ({ signal, callerId, info }) => {
                    const {username, socketID} = info;
                    const user = peersRef.current.find(peer => peer.username === username);
                    const peer = addPeer(signal, callerId, stream);
                    const peerObj = {
                        peer,
                        username: username,
                        peerId: callerId,
                        
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
        setVideoSwitch(value);
    }

    const toggleAudio = (value) => {
        userVideoAudio.current.srcObject.getAudioTracks()[0].enabled = value;
        setAudioSwitch(value);
    }

    const toggleMessages = (value) => {
        setMessagesSwitch(value);
    }

    const leaveRoom = () => {
        userVideoAudio.current.srcObject.getVideoTracks()[0].stop();
        userVideoAudio.current.srcObject.getAudioTracks()[0].stop();
        socket.current.emit("leave-room", {username, roomID});
        navigate("/home");
    }

    const shareScreen = () => {

        if(!screenShareSwitch) {
            navigator.mediaDevices.getDisplayMedia({ video: shareScreenConstraints, cursor: true}).then(stream => {
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
                    setScreenShareSwitch(false);
                };

                userVideoAudio.current.srcObject = stream;
                screenTrackRef.current = screenTrack;
                setScreenShareSwitch(true);
            })
        } else {
            screenTrackRef.current.onended();
        }
    }

    return (
        <RoomContainer>
            <VideoContainer>
                <StyledVideo muted ref={userVideoAudio} autoPlay playsInline/>
                {peers.map((peer) => {
                    return (
                        <Video key={peer.peerId} peer={peer.peer} />
                    );
                })}
            </VideoContainer>
            <Messenger 
                roomID={roomID} 
                toggleMessages={toggleMessages}  
                messagesSwitch={messagesSwitch}/>
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
    width: 100%;
    height: 900px;
    max-height: 100vh;
    display: flex;
    flex-direction: row;
    background-color: #233f30;
`;

const VideoContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-around;
  align-items: center;
  box-sizing: border-box;
  flex-wrap: wrap;

    > * {
       flex: 0 1 50%;
    }
`;

export default CallPage