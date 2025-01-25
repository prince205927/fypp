import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';


export const ClusterActionButtons = ({ 
  clusterName, 
  automaticScaling, 
  fetchAvailableVMs, 
  fetchClusterDetails 
}) => {
  const [isManualNodeModalOpen, setIsManualNodeModalOpen] = useState(false);
  const [isAutomaticScalingEnabled, setIsAutomaticScalingEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState({
    manualNodeAdd: false,
    automaticScaling: false,
    scalingToggle: false
  });


  // Automatic Scaling Toggle Handler
  const handleToggle = async () => {
    try {
      setIsLoading(prev => ({ ...prev, scalingToggle: true }));
      
      const newScalingState = !isAutomaticScalingEnabled;
      
      const response = await axios.post('/api/scaling/toggle', {
        clusterName,
        enabled: newScalingState
      });


      setIsAutomaticScalingEnabled(newScalingState);
      toast.success(response.data.message || `Automatic scaling ${newScalingState ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error(`Failed to toggle scaling: ${error.response?.data?.detail || 'Unknown error'}`);
      // Revert the state if API call fails
      setIsAutomaticScalingEnabled(isAutomaticScalingEnabled);
    } finally {
      setIsLoading(prev => ({ ...prev, scalingToggle: false }));
    }
  };


  // Automatic Node Addition Handler
  const handleAutomaticScaling = async () => {
    try {
      // Validate that automatic scaling is enabled
      if (!isAutomaticScalingEnabled) {
        toast.error('Please enable automatic scaling first');
        return;
      }


      setIsLoading(prev => ({ ...prev, automaticScaling: true }));


      const response = await axios.post('/api/scale/automatic', {
        clusterName,
        master_ip: automaticScaling.masterIp,
        username_master: automaticScaling.masterUsername,
        password_master: automaticScaling.masterPassword,
        port_master: automaticScaling.masterPort
      });


      toast.success(response.data.message);
      // Optionally refresh node list or cluster details
      fetchClusterDetails();
    } catch (error) {
      toast.error(`Automatic scaling failed: ${error.response?.data?.detail || 'Unknown error'}`);
    } finally {
      setIsLoading(prev => ({ ...prev, automaticScaling: false }));
    }
  };
  
  // Manual Node Addition Handler
  const handleManualNodeAdd = async (formData) => {
    try {
      setIsLoading(prev => ({ ...prev, manualNodeAdd: true }));


      // Validate form data
      const requiredFields = [
        'masterIp', 'masterUsername', 'masterPassword', 'masterPort',
        'workerIp', 'workerUsername', 'workerPassword', 'workerPort'
      ];
      
      const missingFields = requiredFields.filter(field => !formData[field]);
      if (missingFields.length > 0) {
        toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
      }


      const response = await axios.post('/api/add-node', {
        clusterName,
        target_ip_master: formData.masterIp,
        username_master: formData.masterUsername,
        password_master: formData.masterPassword,
        port_master: formData.masterPort,
        target_ip_worker: formData.workerIp,
        username_worker: formData.workerUsername,
        password_worker: formData.workerPassword,
        port_worker: formData.workerPort
      });


      toast.success(response.data.message);
      fetchAvailableVMs(); // Refresh the available VMs after adding
      
      // Close the manual node modal
      setIsManualNodeModalOpen(false);
    } catch (error) {
      toast.error(`Failed to add node: ${error.response?.data?.detail || 'Unknown error'}`);
    } finally {
      setIsLoading(prev => ({ ...prev, manualNodeAdd: false }));
    }
  };


  // Manual Node Modal Component
  const ManualNodeModal = ({ 
    isOpen, 
    onClose, 
    onSubmit 
  }) => {
    const [formData, setFormData] = useState({
      masterIp: '',
      masterUsername: '',
      masterPassword: '',
      masterPort: '',
      workerIp: '',
      workerUsername: '',
      workerPassword: '',
      workerPort: ''
    });


    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    };


    const handleSubmit = () => {
      onSubmit(formData);
    };


    if (!isOpen) return null;


    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
        <div className="bg-white p-6 rounded-lg w-96">
          <h2 className="text-xl font-bold mb-4">Add Manual Node</h2>
          
          {/* Master Node Fields */}
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Master Node</h3>
            <input
              type="text"
              name="masterIp"
              placeholder="Master IP"
              value={formData.masterIp}
              onChange={handleInputChange}
              className="w-full border p-2 mb-2 rounded"
            />
            <input
              type="text"
              name="masterUsername"
              placeholder="Username"
              value={formData.masterUsername}
              onChange={handleInputChange}
              className="w-full border p-2 mb-2 rounded"
            />
            <input
              type="password"
              name="masterPassword"
              placeholder="Password"
              value={formData.masterPassword}
              onChange={handleInputChange}
              className="w-full border p-2 mb-2 rounded"
            />
            <input
              type="text"
              name="masterPort"
              placeholder="Port"
              value={formData.masterPort}
              onChange={handleInputChange}
              className="w-full border p-2 rounded"
            />
          </div>


          {/* Worker Node Fields */}
          <div className="mb-4">
            <h3 className="font-semibold mb-2">Worker Node</h3>
            <input
              type="text"
              name="workerIp"
              placeholder="Worker IP"
              value={formData.workerIp}
              onChange={handleInputChange}
              className="w-full border p-2 mb-2 rounded"
            />
            <input
              type="text"
              name="workerUsername"
              placeholder="Username"
              value={formData.workerUsername}
              onChange={handleInputChange}
              className="w-full border p-2 mb-2 rounded"
            />
            <input
              type="password"
              name="workerPassword"
              placeholder="Password"
              value={formData.workerPassword}
              onChange={handleInputChange}
              className="w-full border p-2 mb-2 rounded"
            />
            <input
              type="text"
              name="workerPort"
              placeholder="Port"
              value={formData.workerPort}
              onChange={handleInputChange}
              className="w-full border p-2 rounded"
            />
          </div>
          


          <div className="flex justify-end space-x-2">
            <button 
              onClick={onClose}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 shadow-md transition-colors"
            >
              Add Node
            </button>
          </div>
        </div>
      </div>
    );
  };




  return (
    <div className="relative w-full h-12"> {/* Fixed height container */}
      <div className="absolute right-[24px] bottom-[-80px] flex items-center z-10">
        <div className="flex space-x-4">
          {/* Manual Node Addition Button */}
          <button
            onClick={() => setIsManualNodeModalOpen(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 shadow-md transition-colors"
          >
            Manual Node Addition
          </button>


          {/* Toggle Button */}
          <div className="flex items-center">
            <span className="mr-2">{isAutomaticScalingEnabled ? 'Automatic Scaling On' : 'Automatic Scaling Off'}</span>
            <button
              onClick={handleToggle}
              className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ${
                isAutomaticScalingEnabled ? 'bg-green-500' : 'bg-gray-200'
              }`}
            >
              <span
                className={`transform transition-transform duration-200 absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow ${
                  isAutomaticScalingEnabled ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>


          {/* Automatic Node Addition Button */}
          <button
            onClick={handleAutomaticScaling}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 shadow-md transition-colors"
            disabled={!isAutomaticScalingEnabled || isLoading.automaticScaling}
          >
            {isLoading.automaticScaling ? 'Adding Nodes...' : 'Automatic Node Addition'}
          </button>
        </div>
      </div>


      {/* Manual Node Modal */}
      <ManualNodeModal 
        isOpen={isManualNodeModalOpen} 
        onClose={() => setIsManualNodeModalOpen(false)} 
        onSubmit={handleManualNodeAdd} 
      />
    </div>
  );
};