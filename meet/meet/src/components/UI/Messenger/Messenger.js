import React from 'react'
import { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import io from 'socket.io-client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes,
  faUserFriends,
  faCommentAlt,
  faPaperPlane
} from '@fortawesome/free-solid-svg-icons';
import "./Messenger.scss";


const Messenger = ({
  roomID, 
  toggleMessages, 
  messagesSwitch}) => {
    
  const [message, setMessage] = useState([]);
  const inputRef = useRef();
  const messagesListRef = useRef();
  const socket = io("http://localhost:5000/");

  useEffect(() => {
    socket.emit("join-messenger", {socket: socket.id, user: window.sessionStorage.getItem("username"), roomId: roomID})
    socket.on('receive-message', ({ msg, sender }) => {
      setMessage(messages => [...messages, { msg, sender }]);
    });
  }, []); 

  useEffect(() => {
    messagesListRef.current.scrollIntoView({block: "end"});
  }, [message])

  const sendMessage = (msg) => {
    if (msg) {
      socket.emit('send-message', { roomID, msg, sender: window.sessionStorage.getItem("username") });
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

  return (
    <aside className={`${messagesSwitch ? "messenger-container" : "hide"}`}>
      <div className="messenger-header">
        <h3>Meeting details</h3>
        <FontAwesomeIcon className="icon" icon={faTimes} onClick={() => {toggleMessages(!messagesSwitch);}}/>
      </div>

      <div className="messenger-header-tabs">
        <div className="tab">
          <FontAwesomeIcon className="icon" icon={faUserFriends} />
          <p>People</p>  
        </div>
        <div className="tab active">
          <FontAwesomeIcon className="icon" icon={faCommentAlt} />
          <p>Chat</p>  
        </div>
      </div>

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
                  console.log("miau");
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