require('dotenv').config();
const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const socket = require("socket.io");
const path = require("path");
const io = socket(server, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
});

const users = {};

const socketToRoom = {};
const whiteboardUser = {};
const whiteboardData = {};
const messengerSocket = {};

if(process.env.PROD) {
    app.use(express.static(path.join(__dirname, './meet/build')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, './meet/build/index.html'));
    })
}

const roomHandler = (socket) => {

    const checkRoom = ({roomID}) => {
        const exists = users[roomID] !== undefined;
        socket.emit("res-check-room", exists)
    }

    const joinRoom = ({username, roomID}) => {
        const newUser = {username, socketID: socket.id, video: true, audio: true};
        if (users[roomID]) {
            users[roomID] = users[roomID].filter(user => user.username !== username);
            users[roomID].push(newUser);
        } else {
            users[roomID] = [newUser];
        }

        console.log("Rooms: ");
        console.log(users);
        socketToRoom[socket.id] = roomID;
        socket.emit("users-in-room", users[roomID]);

        socket.on('disconnect', (username) => {
            
            console.log("User left!");
            socket.disconnect();
        });
    };

    const callUser = ({ userToCall, callerId, signal, roomID }) => {
        const user = users[roomID].find(user => user.socketID === callerId);
        io.to(userToCall).emit('incoming-call', { signal: signal, callerId, info: user });
    }

    const callAccepted = ({signal, callerId, username, roomID}) => {
        const user = users[roomID].find(user => user.username === username);
        io.to(callerId).emit('call-was-accepted', { signal, id: user.socketID });
    }

    const leaveRoom = ({username, roomID}) => {
        if(users[roomID]) {
            users[roomID] = users[roomID].filter(user => user.username !== username);
            if(users[roomID].length === 0)
                delete users[roomID];
            else {
                users[roomID].forEach( user => {
                    io.to(user.socketID).emit('user-left', username);
                });
            }
        }
    };

    const joinMessenger = ({user, roomId}) => {
        const newUser = {socketId: socket.id, username: user};
        if(messengerSocket[roomId] === undefined)
            messengerSocket[roomId] = [newUser]
        else {
            messengerSocket[roomId] = messengerSocket[roomId].filter(s => s.username !== user);
            messengerSocket[roomId].push({socketId: socket.id, username: user});
        }

        socket.on('desconnet', () => {
            messengerSocket[roomId] = messengerSocket[roomId].filter(s => s.username !== user);
            if(messengerSocket[roomId]. length === 0) delete messengerSocket[roomId];
        })
    }

    const sendMessage = ({ roomID, msg, sender }) => {
        const room = messengerSocket[roomID];
        room.forEach(user => {
            io.to(user.socketId).emit('receive-message', { msg, sender });
        })
    }


    const startPresenting = ({username, roomId}) => {
        users[roomId].forEach((user) => {
            if(user.username !== username) {
                io.to(user.socketID).emit('start-presenting', { username });
            }
        });
    };

    const stopPresenting = ({username, roomId}) => {
        users[roomId].forEach((user) => {
            if(user.username !== username) {
                io.to(user.socketID).emit('stop-presenting', { userName: username });
            }
        });
    };

    const cameraSwitch = ({username, roomID, value}) => {
        users[roomID].forEach((user) => {
            if(user.username !== username) {
                io.to(user.socketID).emit('camera-switch', { username, value });
            } else {
                user.video = value;
            }
        });
    }

    const microphoneSwitch = ({username, roomID, value}) => {
        users[roomID].forEach((user) => {
            if(user.username !== username) {
                io.to(user.socketID).emit('microphone-switch', { username, value });
            } else{
                user.audio = value;
            }
        });
    }

    const joinWhiteboard = ({username, roomId}) => {
        const newUser = {username, socketId: socket.id};
        if (whiteboardUser[roomId]) {
            whiteboardUser[roomId] = whiteboardUser[roomId].filter(user => user.username !== username);
            whiteboardUser[roomId].push(newUser);
        } else {
            whiteboardUser[roomId] = [newUser];
            whiteboardData[roomId] = [];
        }
        console.log("Whiteboard: ");
        console.log(whiteboardUser);
        io.to(newUser.socketId).emit('refresh-data', {elements: whiteboardData[roomId]});

        socket.on('disconnect', () => {
            if(whiteboardUser[roomId]) {
                whiteboardUser[roomId] = whiteboardUser[roomId].filter(user => user.username !== username);
                if(whiteboardUser[roomId].length === 0) delete whiteboardUser[roomId];
            }

            
            console.log("disconnect");
            console.log(whiteboardUser);
        })
    }

    const canvasData = ({element, roomId, username}) => {
        const index = whiteboardData[roomId].findIndex(elem => elem.id === element.id && elem.username === element.username);
        if(index === -1) {
            whiteboardData[roomId].push(element);
        }
        else {
            whiteboardData[roomId][index] = element;
        }

        whiteboardUser[roomId].forEach( user => {
            if(username !== user.username)
                io.to(user.socketId).emit('canvas-data', {elements: whiteboardData[roomId]});
        });
    }

    const refreshData = ({roomId, username}) => {
        if(whiteboardUser[roomId]) {
            const user = whiteboardUser[roomId].filter(user => user.username === username);
            io.to(user[0].socketId).emit('refresh-data', {elements: whiteboardData[roomId]});
        }
    }

    const deleteElement = ({element, roomId, username}) => {
        const index = whiteboardData[roomId].findIndex(elem => elem.id === element.id && elem.username === element.username);
        if(index !== -1) {
            whiteboardData[roomId] = whiteboardData[roomId]
                .filter(elem => (elem.id !== element.id && elem.username === element.username) || elem.username !== element.username)
                .map(elem => {
                    if(elem.id > element.id && element.username === elem.username) {
                        elem.id -= 1;
                    }

                    return elem;
                });
            whiteboardUser[roomId].forEach( user => {
                if(username !== user.username)
                    io.to(user.socketId).emit('canvas-data', {elements: whiteboardData[roomId]});
            });
        }
    }

    const bye = (message) => {
        console.log(message);

    }

    socket.on("check-room", checkRoom);
    socket.on("join", joinRoom);
    socket.on("call-user", callUser);
    socket.on("call-accepted", callAccepted);
    socket.on("leave-room", leaveRoom);
    socket.on("join-messenger", joinMessenger);
    socket.on("send-message", sendMessage);
    socket.on("start-presenting", startPresenting);
    socket.on("stop-presenting", stopPresenting);
    socket.on("camera-switch", cameraSwitch);
    socket.on("microphone-switch", microphoneSwitch);

    socket.on("join-whiteboard", joinWhiteboard);
    socket.on("canvas-data", canvasData);
    socket.on("refresh-data", refreshData);
    socket.on("delete-element", deleteElement);

    socket.on("bye", bye);
}

io.on('connection', socket => {
    console.log(socket.id);
    roomHandler(socket);
});

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => console.log(`server is running on port ${PORT}`));