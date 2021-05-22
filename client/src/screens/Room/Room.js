import React, { useRef, useEffect, useContext, useState } from "react";
import authApi from "../../context/index";
import { useParams, Link } from "react-router-dom";
import "./Room.css";
import db from "../../components/store/useIndexDB";

//Library imports
import io from "socket.io-client";
import uuid from "uuid";
import copy from "copy-to-clipboard";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import download from "downloadjs";
import DeleteIcon from "@material-ui/icons/Delete";
import { Avatar } from "@material-ui/core";
import SplashScreen from "../../components/SplashScreen/SplashScreen";
import { makeStyles } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import "boxicons";
import Worker from "../../utils/web.worker";

const useStyles = makeStyles({
  table: {
    minWidth: 650,
  },
});

function Room(props) {
  const classes = useStyles();
  const Auth = useContext(authApi);
  let { roomId } = useParams();
  let { roomName } = useParams();
  const [roomData, setRoomData] = useState([]);
  const user = JSON.parse(localStorage.getItem("user"));

  const [peers, setPeers] = useState([]);
  const peerRef = useRef();
  const socketRef = useRef();
  const otherUser = useRef();
  const sendChannel = useRef();
  // const [file, setFile] = useState([]);
  let receiveBuffer = useRef([]);
  const [url, setURL] = useState("");
  let metaData = useRef();
  const [currentFile, setCurrentFile] = useState([]);
  const [userAdded, setUserAdded] = useState(true);
  const roomArr = useRef();
  const [copyHandler, setcopyhandler] = useState(true);

  useEffect(async () => {
    const socketUrl = "wss://p2p.bytebook.co:9000";
    //console.log("Socket URL : ", socketUrl);
    socketRef.current = io.connect(socketUrl);
    socketRef.current.emit("join room", {
      userName: user.userName,
      roomID: roomId,
    });

    socketRef.current.on("get socketID", (data) => {
      //console.log("get socketID", data);
      setPeers((oldArray) => [
        {
          userName: data.userName,
          socketID: data.socketID,
        },
      ]);
    });

    socketRef.current.on("user joined", (data) => {
      otherUser.current = data.socketID;
      //console.log("User Joined", data.socketID);
      setPeers((oldArray) => [...oldArray, data]);
    });

    socketRef.current.on("other user", (data) => {
      callUser(data.socketID);
      otherUser.current = data.socketID;
      //console.log("Other user", data.socketID);
      setPeers((oldArray) => [...oldArray, data]);
    });

    socketRef.current.on("offer", handleOffer);

    socketRef.current.on("answer", handleAnswer);

    socketRef.current.on("user left", (socketId) => {
      setPeers((oldArray) => oldArray.filter((data) => data.socketID !== socketId));
      //console.log("User left", socketId);
    });

    socketRef.current.on("ice-candidate", handleNewICECandidateMsg);

    const roomItem = await db.rooms.get({ roomId: roomId });
    if (!roomItem) {
      await db.rooms.add({
        roomId: roomId,
        roomName: roomName,
        roomData: [],
      });
      setRoomData((arr) => []);
      roomArr.current = [];
    } else {
      setRoomData((arr) => roomItem.roomData);
      roomArr.current = roomItem.roomData;
    }
  }, []);

  useEffect(() => {
    return () => {
      //console.log("componentWillUnmount");
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    //console.log(peers);
    if (peers.length == 1) {
      setUserAdded(true);
    } else {
      setUserAdded(false);
    }
  }, [peers]);

  function callUser(userID) {
    peerRef.current = createPeer(userID);
    sendChannel.current = peerRef.current.createDataChannel("sendChannel");
    //sendChannel.current.binaryType = 'arraybuffer';
    sendChannel.current.onmessage = handleReceiveMessage;
  }

  function createPeer(userID) {
    const peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.l.google.com:19302",
        },
        {
          urls: "turn:numb.viagenie.ca",
          credential: "test1234",
          username: "saivishwak40@gmail.com",
        },
      ],
    });

    peer.onicecandidate = handleICECandidateEvent;
    peer.onnegotiationneeded = () => handleNegotiationNeededEvent(userID);

    return peer;
  }

  function handleNegotiationNeededEvent(userID) {
    peerRef.current
      .createOffer()
      .then((offer) => {
        return peerRef.current.setLocalDescription(offer);
      })
      .then(() => {
        const payload = {
          target: userID,
          caller: socketRef.current.id,
          sdp: peerRef.current.localDescription,
        };
        socketRef.current.emit("offer", payload);
      })
      .catch((e) => console.log(e));
  }
  function handleOffer(incoming) {
    peerRef.current = createPeer();
    peerRef.current.ondatachannel = (event) => {
      sendChannel.current = event.channel;
      sendChannel.current.onmessage = handleReceiveMessage;
    };
    const desc = new RTCSessionDescription(incoming.sdp);
    peerRef.current
      .setRemoteDescription(desc)
      .then(() => {})
      .then(() => {
        return peerRef.current.createAnswer();
      })
      .then((answer) => {
        return peerRef.current.setLocalDescription(answer);
      })
      .then(() => {
        const payload = {
          target: incoming.caller,
          caller: socketRef.current.id,
          sdp: peerRef.current.localDescription,
        };
        socketRef.current.emit("answer", payload);
      });
  }

  function handleAnswer(message) {
    const desc = new RTCSessionDescription(message.sdp);
    peerRef.current.setRemoteDescription(desc).catch((e) => console.log(e));
  }

  function handleICECandidateEvent(e) {
    if (e.candidate) {
      const payload = {
        target: otherUser.current,
        candidate: e.candidate,
      };
      socketRef.current.emit("ice-candidate", payload);
    }
  }

  function handleNewICECandidateMsg(incoming) {
    const candidate = new RTCIceCandidate(incoming);

    peerRef.current.addIceCandidate(candidate).catch((e) => console.log(e));
  }

  function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }

  function sendFile(e) {
    try {
      let files = e.target.files;
      let metaObj;
      const worker = new Worker();
      worker.postMessage({
        files: files,
      });
      worker.addEventListener("message", (event) => {
        if (event.data == "Done") {
          sendChannel.current.send(`Done-${JSON.stringify(metaObj)}`);
          roomArr.current.push({ id: metaObj.id, fileName: metaObj.name, fileSize: formatBytes(metaObj.size), operation: "Sent" });
          setRoomData((prev) => roomArr.current);
          db.rooms.update({ roomId: roomId }, { roomData: roomArr.current });
          worker.terminate();
          return;
        }
        if (typeof event.data == "string") {
          if (event.data.includes("Meta-")) {
            metaObj = JSON.parse(event.data.substring(5, event.data.length));
            setRoomData((prev) => [...prev, { id: metaObj.id, fileName: metaObj.name, fileSize: formatBytes(metaObj.size), operation: "Sending" }]);
            sendChannel.current.send(`Meta-${event.data.substring(5, event.data.length)}`);
          }
          //console.log(event.data);
        } else {
          // sendChannel.current.readyState
          if (sendChannel.current.readyState == "open") {
            sendChannel.current.send(event.data);
          } else {
            worker.terminate();
            return window.location.reload();
          }
        }
      });
    } catch (err) {
      console.log(err);
    }
  }

  function handleReceiveMessage(e) {
    if (e.data.toString().substring(0, 4) == "Done") {
      const file = new Blob(receiveBuffer.current);
      //console.log("file", file, "meta", metaData.current);
      download(file, metaData.current.name, metaData.current.type);
      const metaObj = metaData.current;
      roomArr.current.push({ id: metaObj.id, fileName: metaObj.name, fileSize: formatBytes(metaObj.size), operation: "Received" });
      db.rooms.update({ roomId: roomId }, { roomData: roomArr.current });
      setRoomData((prev) => roomArr.current);
      // setRoomData((prev) => [...prev, { id: metaObj.id, fileName: metaObj.name, fileSize: formatBytes(metaObj.size), operation: "Received" }]);
      // roomArr.current.push({ id: metaObj.id, fileName: metaObj.name, fileSize: formatBytes(metaObj.size), operation: "Received" });
      // db.rooms.update({ roomId: roomId }, { roomData: roomArr.current });
      metaData.current = {};
      receiveBuffer.current = [];
      //setURL(() => URL.createObjectURL(file));
    } else if (e.data.toString().substring(0, 4) == "Meta") {
      metaData.current = JSON.parse(e.data.toString().substring(5, e.data.toString().length));
      setRoomData((prev) => [...prev, { id: metaData.current.id, fileName: metaData.current.name, fileSize: formatBytes(metaData.current.size), operation: "Receiving" }]);
      //console.log(metaData.current, "meta");
    } else {
      //console.log("recieving data");
      receiveBuffer.current.push(e.data);
    }
    //setMessages(messages => [...messages, {yours: false, value: e.data}]);
    //setimageSource(`data:image/gif;base64,${e.data}`);
  }

  const handelCopy = (e) => {
    e.preventDefault();
    copy(window.location.href);
    setcopyhandler(false);
    setTimeout(() => {
      setcopyhandler(true);
    }, [2000]);
  };
  const handleClose = () => {
    setcopyhandler(true);
  };

  const avatarItem = peers.map(({ userName, socketID }) => (
    <div className='roomMiddleContainerEach'>
      <Avatar>{userName.substring(0, 1)}</Avatar>
      <p>{userName}</p>
    </div>
  ));

  return (
    <div className='room'>
      <SplashScreen />
      <div className='roomTopContainer'>
        <Link to='/'>
          <box-icon name='arrow-back' flip='vertical' color='#636979' size='25px'></box-icon>
        </Link>
        <div style={{ display: "flex", alignItems: "center", flexDirection: "column" }}>
          <h3 style={{ marginBottom: "5px" }}>{roomName}</h3>
          <p style={{ color: "#636979" }}>Room Name</p>
        </div>
        <box-icon name='share-alt' type='solid' flip='vertical' color='#636979' size='25px' aria-label='Click to copy url' onClick={handelCopy}></box-icon>
      </div>
      <div className='roomMiddleContainer'>
        <div className='roomMiddleContainerAvatars'>{avatarItem}</div>
        {peers.length > 1 ? "" : <p>No one is in the room. Share your url to start</p>}
      </div>
      <div className='roomBottomContainer'>
        <TableContainer component={Paper}>
          <Table className={classes.table} aria-label='table'>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell align='right'>ID</TableCell>
                <TableCell align='right'>File Name</TableCell>
                <TableCell align='right'>File Size</TableCell>
                <TableCell align='right'>Status</TableCell>
                <TableCell align='right'>Delete</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roomData.map((row, index) => (
                <TableRow key={index}>
                  <TableCell component='th' scope='row'>
                    {index + 1}
                  </TableCell>
                  <TableCell align='right'>{row.id}</TableCell>
                  <TableCell align='right'>{row.fileName}</TableCell>
                  <TableCell align='right'>{row.fileSize}</TableCell>
                  <TableCell align='right'>{row.operation}</TableCell>
                  <TableCell align='right'>
                    <DeleteIcon
                      className='roomTalbeDelete'
                      onClick={(e) => {
                        const newItems = roomData.filter((data) => data.id != row.id);
                        db.rooms.update(roomId, {
                          roomData: newItems,
                        });
                        setRoomData((arr) => newItems);
                        roomArr.current = newItems;
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>
      {/* Add multiple to the input select multiple files  */}
      <input className={!userAdded ? "room_sendFile" : "room_sendFile buttonDisabled"} disabled={userAdded} type='file' title='Select File' onChange={sendFile} />

      {/* <FileShareDialog /> */}
      <Dialog open={!copyHandler} onClose={handleClose} aria-labelledby='alert-dialog-title' aria-describedby='alert-dialog-description'>
        <DialogTitle id='alert-dialog-title'>{"Clipboard"}</DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>Url copied to your clipboard. Share this with peer to start sharing</DialogContentText>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Room;
