/* eslint-disable */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import './App.global.css';

import SipRegister from './views/SipRegister';
import Home from './views/Home';

import * as SIP from './sip/SIP';

const App = () => {

  // READ ONLY: do NOT use this setIsRegistered. Use SIP.setIsRegistered because it calls back to this. Keep the register status centralized.
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    SIP.setIsRegisteredCallback((isReg : boolean) => { setIsRegistered(isReg); });
    return () => SIP.setIsRegisteredCallback((isReg : boolean) => { });
  }, []);

  return (
    <Router>
      <Switch>
        <Route path="/home" component={() => <Home isRegistered={isRegistered} />} />
        <Route path="/" component={() => <SipRegister isRegistered={isRegistered} />} />
      </Switch>
    </Router>
  );
};

export default App;
