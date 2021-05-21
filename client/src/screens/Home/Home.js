import React, { useEffect, useState, useContext } from "react";
import "./Home.css";
import authApi from "../../context/index";
import { useHistory, Switch, Route } from "react-router-dom";
import SplashScreen from "../../components/SplashScreen/SplashScreen";
import Board from "../../components/Board/Board";
import AddIcon from "@material-ui/icons/Add";
import CreateRoomDialog from "../../components/CreateRoomDialog/CreateRoomDialog";
import { useLiveQuery } from "dexie-react-hooks";
import uuid from "uuid";
import db from "../../components/store/useIndexDB";

function Home() {
  const history = useHistory();
  const Auth = useContext(authApi);
  const user = localStorage.getItem("user");
  const [createRoomBool, setcreateRoomBool] = useState(false);
  const [roomName, setRoomName] = useState("");

  // useEffect(() => {
  //   if (!Auth.auth) history.push("/");
  // }, []);

  const addItemToDb = async (event) => {
    if (roomName.length == 0) return;
    event.preventDefault();
    await db.rooms.add({
      roomId: uuid.v4(),
      roomName: roomName,
      roomData: [],
    });
    setcreateRoomBool(false);
    setRoomName("");
  };
  const allItems = useLiveQuery(() => db.rooms.toArray(), []);
  if (!allItems) return null;

  const roomOnClose = async (e) => {
    //console.log(e.target);
    await db.rooms.delete(e.target.value);
  };

  const roomOnClick = (e) => {
    // console.log(e.target);
    history.push(`/room/${e.target.id}`);
  };

  const itemData = allItems.map(({ roomName, roomId }) => <Board key={roomId} roomName={roomName} id={roomId} onClose={roomOnClose} onClick={roomOnClick} />);

  return (
    <div className='home'>
      {Auth.auth ? <SplashScreen /> : ""}
      <h1>Recent Rooms</h1>
      {allItems.length > 0 ? (
        <div className='homeContainer__rooms'>{itemData}</div>
      ) : (
        <div className='homeContainer__roomsEmpty'>
          <p>Start by joining a room using the + button</p>
          <p>Devices must join same room to share files with each other</p>
        </div>
      )}

      <button className='home_CreatButton' onClick={() => setcreateRoomBool(true)}>
        <AddIcon />
        <h2>New Room</h2>
      </button>

      <CreateRoomDialog bool={createRoomBool} onClose={() => setcreateRoomBool(false)} createRoom={addItemToDb} setRoomName={setRoomName} roomName={roomName} />
    </div>
  );
}

export default Home;
