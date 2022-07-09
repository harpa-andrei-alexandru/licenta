import React from 'react'
import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import io from 'socket.io-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes,
  faUserFriends,
  faCommentAlt,
  faPaperPlane,
  faUser,
  faVideo,
  faVideoSlash,
  faMicrophone,
  faMicrophoneSlash,
  faDesktop
} from '@fortawesome/free-solid-svg-icons';
import "./Messenger.scss";


const Messenger = ({
  roomID, 
  toggleMessages, 
  messagesSwitch,
  people,
  selectPresentation,
  currentUsername,
  currentVideo,
  currentAudio,
  currentPresenting
  }) => {
    
  const [message, setMessage] = useState([]);
  const [chatPeopleSwitch, setChatPeopleSwitch] = useState(true);
  const inputRef = useRef();
  const messagesListRef = useRef();
  const socket = useRef();

  useEffect(() => {
    socket.current = io("http://localhost:5000/");
    socket.current.emit("join-messenger", {socket: socket.id, user: window.sessionStorage.getItem("username"), roomId: roomID})
    socket.current.on('receive-message', ({ msg, sender }) => {
      setMessage(messages => [...messages, { msg, sender }]);
    });

    return () => {
      socket.current.disconnect();
    }
  }, []); 

  useEffect(() => {
    if(chatPeopleSwitch)
      messagesListRef.current.scrollIntoView({block: "end"});
  }, [message])

  useEffect(() => {
    if(chatPeopleSwitch)
      messagesListRef.current.scrollIntoView({block: "end"});
  }, [chatPeopleSwitch])

  const sendMessage = (msg) => {
    if (msg) {
      socket.current.emit('send-message', { roomID, msg, sender: window.sessionStorage.getItem("username") });
      inputRef.current.value = '';
    }
  };

  const sendMessageOnEnter = (e) => {
    if (e.key === 'Enter') {
      const msg = e.target.value;
      sendMessage(msg);
    }
  }

  const sendMessageOnIcon = () => {
    const msg = inputRef.current.value;
    sendMessage(msg);
  }

  const selectUserPresentation = (isPresenting, username) => {
    if(isPresenting)
      selectPresentation(username);
  }

  return (
    <aside className={`${messagesSwitch ? "messenger-container" : "hide"}`}>
      <div className="messenger-header">
        <h3>Meeting details</h3>
        <FontAwesomeIcon className="icon" icon={faTimes} onClick={() => {toggleMessages(!messagesSwitch);}}/>
      </div>

      <div className="messenger-header-tabs">
        <div className={`tab ${!chatPeopleSwitch ? 'active' : ''}`} onClick={() => setChatPeopleSwitch(false)}>
          <FontAwesomeIcon className="icon" icon={faUserFriends} />
          <p>People</p>  
        </div>
        <div className={`tab ${chatPeopleSwitch ? 'active' : ''}`} onClick={() => setChatPeopleSwitch(true)}>
          <FontAwesomeIcon className="icon" icon={faCommentAlt} />
          <p>Chat</p>  
        </div>
      </div>
      {chatPeopleSwitch ? 
        <>
          <div className="chat-section">
            <div className="chat-block">
              <div className="sender" ref={messagesListRef}>
                {message && 
                  message.map(({sender, msg}, idx) => {
                    if(sender !== window.sessionStorage.getItem("username")) {
                      return(
                        <OthersMessage key={idx}>
                          <p className="username">{sender}</p>
                          <p className="message">{msg}</p>
                        </OthersMessage>
                      );
                    } else {
                      return (
                        <MyMessage key={idx}>
                          <p className="username">{sender}</p>
                          <p className="message">{msg}</p>
                        </MyMessage>
                      );
                    }
                  })}
              </div>
            </div>
          </div>

          <div className="send-msg-section">
            <textarea name="text" rows="5" wrap="soft" placeholder="Send a message" ref={inputRef} onKeyUp={sendMessageOnEnter} />
            <FontAwesomeIcon className="icon" icon={faPaperPlane} onClick={sendMessageOnIcon}/>
          </div> 
        </>
        :
        <div className="people-section">
          <div className="people-block">
            <div className="user" key="777" onClick={() => selectUserPresentation(currentPresenting, currentUsername)}>
                <div className="user-details">
                  <div className="user-icon-container">
                    <FontAwesomeIcon className="user-icon" icon={faUser}/>
                  </div>
                  <p>{currentUsername}</p>
                </div>
                <div className="user-controls">
                  <div className={`video-icon-container ${!currentVideo ? "close" : ""}`}>
                    {currentVideo ? <FontAwesomeIcon className="video-icon" icon={faVideo}/> : <FontAwesomeIcon className="video-icon" icon={faVideoSlash}/>}
                  </div>
                  <div className={`audio-icon-container ${!currentAudio ? "close" : ""}`}>
                    {currentAudio ? <FontAwesomeIcon className="microphone-icon" icon={faMicrophone}/> : <FontAwesomeIcon className="microphone-icon" icon={faMicrophoneSlash}/>}
                  </div>
                  <div className="presenting-icon-container">
                    {currentPresenting && <FontAwesomeIcon className="presenting-icon" icon={faDesktop}/>}
                  </div>
                </div>
              </div>
            {people.map((user, idx) => <div className="user" key={idx} onClick={() => selectUserPresentation(user.presenting, user.username)}>
              <div className="user-details">
                <div className="user-icon-container">
                  <FontAwesomeIcon className="user-icon" icon={faUser}/>
                </div>
                <p>{user.username}</p>
              </div>
              <div className="user-controls">
                <div className={`video-icon-container ${!user.video ? "close" : ""}`}>
                  {user.video ? <FontAwesomeIcon className="video-icon" icon={faVideo}/> : <FontAwesomeIcon className="video-icon" icon={faVideoSlash}/>}
                </div>
                <div className={`audio-icon-container ${!user.audio ? "close" : ""}`}>
                  {user.audio ? <FontAwesomeIcon className="microphone-icon" icon={faMicrophone}/> : <FontAwesomeIcon className="microphone-icon" icon={faMicrophoneSlash}/>}
                </div>
                <div className="presenting-icon-container">
                  {user.presenting && <FontAwesomeIcon className="presenting-icon" icon={faDesktop}/>}
                </div>
              </div>
            </div>)}
          </div>
        </div>
      }
    </aside>
  )
}

export default Messenger


const OthersMessage = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin: 15px 0px 15px 0px;
  text-align: left;

  > .username {
    font-weight: 600;
  }

  > .message {
    max-width: 80%;
    width: auto;
    padding: 9px;
    margin-top: 3px;
    word-break: break-all;
    font-size: 13px;
    font-weight: 400;
    background: rgba(241, 199, 136, 0.702);
    border-radius: 7px;
  }
`;

const MyMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  width: 100%;
  margin-top: 15px;
  text-align: right;

  > .username {
    font-weight: 600;
  }

  > .message {
    max-width: 80%;
    width: auto;
    padding: 9px;
    margin-top: 3px;
    word-break: break-all;
    font-size: 13px;
    font-weight: 400;
    text-align: left;
    background: rgb(205, 233, 224, 0.702);
    border-radius: 7px;
  }
`;