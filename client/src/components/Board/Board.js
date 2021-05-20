import React from "react";
import "./Board.css";
import CloseIcon from "@material-ui/icons/Close";

function Board(props) {
  return (
    <div className='board'>
      <div className='boardTop'>
        <div style={{ flex: 1 }}></div>
        <button value={props.id} className='board_Close' aria-label='delete' onClick={props.onClose}>
          <CloseIcon className='board_CloseIcon' />
        </button>
      </div>
      <div className='boardBotton' id={props.id + "/" + props.roomName} onClick={props.onClick}>
        <h3 id={props.id + "/" + props.roomName}>{props.roomName}</h3>
      </div>
    </div>
  );
}

export default Board;
