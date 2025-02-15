// import React from 'react';
// import { Provider } from 'react-redux';
// import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
// import { store } from './store';
// import MonitoringDashboard from './components/MonitoringDashboard';

// import ClusterDetails from './components/ClusterDetails';


// import Jenkins from './components/Jenkins';



// function App() {
//   return (
//     <Provider store={store}>
//       <Router>
//         <Routes>
//           <Route path = '/' element={<MonitoringDashboard/>}/>
//           <Route path="/dashboard" element={<MonitoringDashboard />} />
//           <Route path="/dashboard/clusters/:clusterName" element={<ClusterDetails />} />
//           <Route path="/jenkins" element={<Jenkins />} />
//         </Routes>
//       </Router>
//     </Provider>
//   );
// }


// export default App;

// App.js
import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { store } from './store';
import MonitoringDashboard from './components/MonitoringDashboard';
import ClusterDetails from './components/ClusterDetails';
import Jenkins from './components/Jenkins';


function App() {
  return (
    <Provider store={store}>
  
        <Router>
          <Routes>
            <Route path='/' element={<MonitoringDashboard/>}/>
            <Route path="/dashboard" element={<MonitoringDashboard />} />
            <Route path="/dashboard/clusters/:clusterName" element={<ClusterDetails />} />
            <Route path="/jenkins" element={<Jenkins />} />
          </Routes>
        </Router>
  
    </Provider>
  );
}

export default App;