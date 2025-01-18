import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { store } from './store';
import MonitoringDashboard from './components/MonitoringDashboard';
import Account from './components/Account';
import ClusterDetails from './components/ClusterDetails';

import Settings from './components/Settings';
import Jenkins from './components/Jenkins';
import Scaling  from './components/Scaling';


function App() {
  return (
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path = '/' element={<MonitoringDashboard/>}/>
          <Route path="/dashboard" element={<MonitoringDashboard />} />
          <Route path="/account" element={<Account />} />
          <Route path="/scaling" element={<Scaling/>} />
          <Route path="/dashboard/clusters/:clusterName" element={<ClusterDetails />} />
          <Route path="/jenkins" element={<Jenkins />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Router>
    </Provider>
  );
}


export default App;