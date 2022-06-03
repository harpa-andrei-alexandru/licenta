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

var lastData;

if(process.env.PROD) {
    app.use(express.static(path.join(__dirname, './meet/build')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, './meet/build/index.html'));
    })
}

const roomHandler = (socket) => {
    const joinRoom = ({username, roomID}) => {
        const newUser = {username, socketID: socket.id};
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
            console.log(socket.id);
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
        users[roomID] = users[roomID].filter(user => user.username !== username);
        if(users[roomID].length === 0)
            delete users[roomID];
        else {
            users[roomID].forEach( user => {
                io.to(user.socketID).emit('user-left', username);
            });
        }
    };

    const sendMessage = ({ roomID, msg, sender }) => {
        let room = users[roomID];
        room.forEach(user => {
            io.to(user.socketID).emit('receive-message', { msg, sender });
        })
    }

    socket.on("join", joinRoom);
    socket.on("call-user", callUser);
    socket.on("call-accepted", callAccepted);
    socket.on("leave-room", leaveRoom);
    socket.on("send-message", sendMessage);
}
const users = {};

const socketToRoom = {};
const whiteboardUser = {};
let socketList = {}

io.on('connection', socket => {
    console.log(socket.id);
    roomHandler(socket);
    socket.on("req-check-room", roomID => {
        const exists = users[roomID] !== undefined;
        socket.emit("res-check-room", exists)
    })

    socket.on('canvas-data', (data) => {
        lastData = data;
        socket.broadcast.emit('canvas-data', data);
    });

    socket.on('refresh-data', (data) => {
        console.log(data);
        console.log(socket.id);
        socket.broadcast.emit('canvas-data', lastData);
    })
});

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => console.log(`server is running on port ${PORT}`));