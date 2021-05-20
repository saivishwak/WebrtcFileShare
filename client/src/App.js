import React, { useState, useEffect, useContext } from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import "./App.css";
import authApi from "./context/index";

//Screens Import
import Login from "./screens/login/Login";
import Home from "./screens/Home/Home";
import Room from "./screens/Room/Room";
import Page404 from "./screens/Page404/Page404";

function App() {
  const [auth, setAuth] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("user")) {
      setAuth(true);
    }
  }, []);
  return (
    <div className='app'>
      <authApi.Provider value={{ auth, setAuth }}>
        {!auth ? (
          <Login />
        ) : (
          <Router>
            <Switch>
              <Route path='/room/:roomId/:roomName'>
                <Room />
              </Route>
              <Route exact path='/'>
                <Home />
              </Route>
              <Route path='*' component={Page404} />
            </Switch>
          </Router>
        )}
      </authApi.Provider>
    </div>
  );
}
export default App;
