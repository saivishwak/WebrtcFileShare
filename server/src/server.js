const express = require("express");
const https = require("https");
const http = require("http");
const url = require("url");
const cors = require("cors");
const app = express();
const fs = require("fs");
const dotenv = require("dotenv");
dotenv.config();

app.use(cors());
//initialize a simple http server
let server;

if (process.env.NODE_ENV == "production") {
  console.log("Production");
  var privateKey = fs.readFileSync("/etc/letsencrypt/live/p2p.bytebook.co/privkey.pem", "utf8");
  var certificate = fs.readFileSync("/etc/letsencrypt/live/p2p.bytebook.co/cert.pem", "utf8");
  var credentials = { key: privateKey, cert: certificate };
  server = https.createServer(credentials, app);
} else {
  console.log("developement");
  server = http.createServer(app);
}

app.get("/", (req, res) => {
  res.send("Hello from node0 server");
});

const rooms = {};
const socketToRoom = {};

const io = require("socket.io")(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
  console.log("socket connected :", socket.id, rooms);
  socket.on("join room", (data) => {
    const { roomID, userName } = data;
    if (rooms[roomID]) {
      const length = rooms[roomID].length;
      if (length === 2) {
        socket.emit("room full");
        return;
      }
      rooms[roomID].push({
        userName: userName,
        socketID: socket.id,
      });
    } else {
      rooms[roomID] = [
        {
          userName: userName,
          socketID: socket.id,
        },
      ];
    }
    console.log("join roomID: ", roomID, rooms[roomID]);
    socketToRoom[socket.id] = roomID;
    socket.emit("get socketID", {
      userName: userName,
      socketID: socket.id,
    });
    const otherUser = rooms[roomID].find((data) => data.socketID !== socket.id);
    if (otherUser) {
      socket.emit("other user", otherUser);
      socket.to(otherUser.socketID).emit("user joined", {
        userName: userName,
        socketID: socket.id,
      });
    }
  });

  socket.on("offer", (payload) => {
    io.to(payload.target).emit("offer", payload);
  });

  socket.on("answer", (payload) => {
    io.to(payload.target).emit("answer", payload);
  });

  socket.on("ice-candidate", (incoming) => {
    io.to(incoming.target).emit("ice-candidate", incoming.candidate);
  });

  socket.on("disconnect", () => {
    console.log("user Disconnected: ", socket.id);
    const roomID = socketToRoom[socket.id];
    let room = rooms[roomID];
    if (room) {
      room = room.filter((data) => data.socketID !== socket.id);
      rooms[roomID] = room;
      console.log("rooms", rooms);
      socket.broadcast.emit("user left", socket.id);
    }
  });
});

//start our server
server.listen(process.env.PORT || 9000, () => {
  console.log(`Server started on port ${server.address().port}`);
});
