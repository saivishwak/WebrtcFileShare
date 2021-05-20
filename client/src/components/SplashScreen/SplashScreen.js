import React, { useEffect } from "react";
import "./SplashScreen.css";
import "boxicons";

function SplashScreen() {
  useEffect(() => {
    setTimeout(() => {
      document.querySelector(".splashScreen").style.display = "none";
    }, 1000);
  }, []);
  return (
    <div className='splashScreen'>
      <box-icon name='javascript' type='logo' animation='tada' color='#ffffff' size='100px'></box-icon>
    </div>
  );
}

export default SplashScreen;
