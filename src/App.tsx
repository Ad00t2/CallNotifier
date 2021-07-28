/* eslint-disable */

import React from 'react';
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom';
import './App.global.css';

import SipRegister from './views/SipRegister';
import Home from './views/Home';

const App = () => {

  const [isRegistered, setIsRegistered] = React.useState(false);

  return (
    <Router>
      <Switch>
        <Route path="/home" component={() => <Home isRegistered={isRegistered} />} />
        <Route path="/" component={() => <SipRegister setIsRegistered={setIsRegistered} />} />
      </Switch>
    </Router>
  );
};

export default App;
