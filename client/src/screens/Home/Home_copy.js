import React, { useRef, useState, useEffect } from "react";
import "./Home.css";

//Library imports
import io from "socket.io-client";

function Home() {
  const [peers, setPeers] = useState([]);
  const peerRef = useRef();
  const socketRef = useRef();
  const otherUser = useRef();
  const sendChannel = useRef();
  const [file, setFile] = useState(null);
  let receiveBuffer = [];
  const [url, setURL] = useState("");
  // const [connectionEstablished, setConnection] = useState(false);
  // const [file, setFile] = useState();
  // const [gotFile, setGotFile] = useState(false);
  useEffect(() => {
    socketRef.current = io.connect("http://localhost:5000");
    socketRef.current.emit("join room", "123");
    socketRef.current.on("user joined", (userID) => {
      otherUser.current = userID;
      console.log(userID);
      setPeers((oldArray) => [...oldArray, userID]);
    });

    socketRef.current.on("other user", (userID) => {
      callUser(userID);
      otherUser.current = userID;
      console.log(userID);
      setPeers((oldArray) => [...oldArray, userID]);
    });

    socketRef.current.on("offer", handleOffer);

    socketRef.current.on("answer", handleAnswer);

    socketRef.current.on("ice-candidate", handleNewICECandidateMsg);
  }, []);

  function callUser(userID) {
    peerRef.current = createPeer(userID);
    sendChannel.current = peerRef.current.createDataChannel("sendChannel");
    //sendChannel.current.binaryType = 'arraybuffer';
    sendChannel.current.onmessage = handleReceiveMessage;
  }

  function handleReceiveMessage(e) {
    if (e.data.toString() == "Done!") {
      const file = new Blob(receiveBuffer);
      console.log(file);
      setURL(() => URL.createObjectURL(file));
    } else {
      receiveBuffer.push(e.data);
    }
    //setMessages(messages => [...messages, {yours: false, value: e.data}]);
    //setimageSource(`data:image/gif;base64,${e.data}`);
  }

  function createPeer(userID) {
    const peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: "stun:stun.stunprotocol.org",
        },
        {
          urls: "turn:numb.viagenie.ca",
          credential: "muazkh",
          username: "webrtc@live.com",
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

  function sendFile() {
    file.arrayBuffer().then((buffer) => {
      while (buffer.byteLength) {
        const chunk = buffer.slice(0, 16 * 1024);
        buffer = buffer.slice(16 * 1024, buffer.byteLength);
        sendChannel.current.send(chunk);
      }
      sendChannel.current.send("Done!");
    });
  }

  return (
    <div className='home'>
      <h1>P2P WEBRTC FILE TRANSFER</h1>
      <input
        className='button'
        type='file'
        title='Select File'
        onChange={(e) => {
          setFile(e.target.files[0]);
          console.log(e.target.files[0].size);
        }}
      />
      <button className='button' onClick={sendFile}>
        Send File
      </button>
      <button className='button'>Download File</button>
      <p>No of peers connected : {peers.length}</p>
      <a id='urlTag' href={url} download='test.png'>
        Download Link
      </a>
    </div>
  );
}

export default Home;
