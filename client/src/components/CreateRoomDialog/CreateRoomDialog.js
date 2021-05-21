import React from "react";
import "./CreateRoomDialog.css";
import CloseIcon from "@material-ui/icons/Close";

function CreateRoomDialog(props) {
  if (props.bool) {
    return (
      <div className='createRoomDialog'>
        <form className='createRoomDialog__container' onSubmit={props.createRoom}>
          <CloseIcon onClick={props.onClose} className='createRoomDialog__close' />
          <input autoFocus placeholder='Room name' required maxLength='20' value={props.roomName} onChange={(e) => props.setRoomName(e.target.value)}></input>
          <button type='submit' onClick={props.createRoom}>
            Create Room
          </button>
          <p>Last step to share your files!</p>
        </form>
      </div>
    );
  } else {
    return "";
  }
}

export default CreateRoomDialog;
