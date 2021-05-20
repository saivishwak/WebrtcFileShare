import React, { useState, useEffect } from "react";
import "./CreateRoomDialog.css";
import CloseIcon from "@material-ui/icons/Close";
import { useHistory } from "react-router-dom";

function CreateRoomDialog(props) {
  if (props.bool) {
    return (
      <div className='createRoomDialog'>
        <div className='createRoomDialog__container'>
          <CloseIcon onClick={props.onClose} className='createRoomDialog__close' />
          <input placeholder='Room name' maxLength='20' value={props.roomName} onChange={(e) => props.setRoomName(e.target.value)}></input>
          <button onClick={props.createRoom}>Create Room</button>
          <p>Last step to share your files!</p>
        </div>
      </div>
    );
  } else {
    return "";
  }
}

export default CreateRoomDialog;
