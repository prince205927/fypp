import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { store } from './store';
import MonitoringDashboard from './components/MonitoringDashboard';
import ClusterDetails from './components/ClusterDetails';
import Jenkins from './components/Jenkins';
import Signup from './components/SignUp';
import Login from './components/Login';
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('isAuthenticated');
  
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};
function App() {
  return (
    <Provider store={store}>
  
        <Router>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
            <Route path='/' element={<ProtectedRoute><MonitoringDashboard/></ProtectedRoute>}/>
            <Route path="/dashboard" element={<ProtectedRoute><MonitoringDashboard /></ProtectedRoute>} />
            <Route path="/dashboard/clusters/:clusterName" element={<ProtectedRoute><ClusterDetails /></ProtectedRoute>} />
            <Route path="/jenkins" element={<ProtectedRoute><Jenkins /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
  
    </Provider>
  );
}

export default App;