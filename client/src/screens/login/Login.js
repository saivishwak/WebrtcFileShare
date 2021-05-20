import React, { useState, useContext, useEffect } from "react";
import "./Login.css";
import "boxicons";
import { useHistory } from "react-router-dom";
import authApi from "../../context/index";
import Dialog from "@material-ui/core/Dialog";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import SplashScreen from "../../components/SplashScreen/SplashScreen";

function Login() {
  const [userName, setUserName] = useState("");
  const [dialogBool, setDialogBool] = useState(false);
  const Auth = useContext(authApi);
  const history = useHistory();

  const signIn = (e) => {
    e.preventDefault();
    if (userName.length > 0) {
      localStorage.setItem(
        "user",
        JSON.stringify({
          userName: userName,
          avatarSeed: Math.random(),
        })
      );
      Auth.setAuth(true);
      history.push("/");
    } else {
      setDialogBool(true);
      //alert("Name cannot be empty");
    }
  };
  const handleClose = () => {
    setDialogBool(false);
  };
  return (
    <div className='login'>
      {!Auth.auth ? <SplashScreen /> : ""}
      <div className='loginContainer'>
        {/* <img className='logologin' src='./logo.svg' alt='ByteBook Logo' /> */}
        <div className='typewriter'>
          <h1>
            Hi,
            <span className='typeweritter__span' style={{ fontSize: "20px" }}>
              Welcome to Bytebook
            </span>
          </h1>
        </div>
        <p className='textFadeIn'>A new way to share files.</p>
        <form className='loginForm'>
          <div style={{ display: "flex", alignItems: "center" }}>
            <box-icon type='solid' name='terminal' color='white' size='20px'></box-icon>
            <p style={{ marginLeft: "10px" }}>Enter your name to get started</p>
          </div>

          <input className='loginContainer__input' onChange={(e) => setUserName(e.target.value)} placeholder='Username' type='text' value={userName} maxLength='50' style={{ width: "100%" }}></input>
          <div className='loginContainer_bottom'>
            <button className='signinButton' onClick={signIn}>
              Get Started
            </button>
          </div>
        </form>
        <div className='login__footer'>
          <p>© 2021 - present Bytebook.co Released under the MIT License</p>
        </div>
      </div>
      <Dialog open={dialogBool} onClose={handleClose} aria-labelledby='alert-dialog-title' aria-describedby='alert-dialog-description'>
        <DialogTitle id='alert-dialog-title'>{"Error type: Name"}</DialogTitle>
        <DialogContent>
          <DialogContentText id='alert-dialog-description'>Username cannot be empty. Please enter a valid username to get started.</DialogContentText>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Login;
