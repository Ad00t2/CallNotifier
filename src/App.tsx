/* eslint-disable */

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import './App.global.css';

import SipRegister from './views/SipRegister';
import Home from './views/Home';

import * as SIP from './sip/SIP';

const App = () => {

  const [sharedErrorMsg, setSharedErrorMsg] = useState('');

  return (
    <Router>
      <Switch>
        <Route path="/home" component={() => <Home />} />
        <Route path="/" component={() => <SipRegister sharedErrorMsg={sharedErrorMsg} setSharedErrorMsg={setSharedErrorMsg} />} />
      </Switch>
    </Router>
  );
};

export default App;
