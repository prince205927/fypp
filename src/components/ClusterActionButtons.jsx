import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';


const BASE_URL = 'http://127.0.0.1:8000';


export const ClusterActionButtons = ({ clusterName }) => {
  const [isManualNodeModalOpen, setIsManualNodeModalOpen] = useState(false);
  const [isAutomaticScalingEnabled, setIsAutomaticScalingEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState({
    manualNodeAdd: false,
    automaticScaling: false
  });


  // Manual Node Addition Handler
  const handleManualNodeAdd = async (formData) => {
    try {
      setIsLoading(prev => ({ ...prev, manualNodeAdd: true }));


      // Validate form data
      const requiredFields = ['ip', 'username', 'password', 'port'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      if (missingFields.length > 0) {
        toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
      }


      const response = await axios.post(`${BASE_URL}/manual_add_node/`, {
        cluster_name: clusterName,
        ip: formData.ip,
        username: formData.username,
        password: formData.password,
        port: formData.port
      });


      toast.success(response.data.message || 'Node added successfully');
      setIsManualNodeModalOpen(false);
    } catch (error) {
      toast.error(`Failed to add node: ${error.response?.data?.detail || 'Unknown error'}`);
    } finally {
      setIsLoading(prev => ({ ...prev, manualNodeAdd: false }));
    }
  };

// Automatic Scaling Toggle Handler
const handleToggle = async () => {
    try {
      setIsLoading(prev => ({ ...prev, scalingToggle: true }));
      
      const newScalingState = !isAutomaticScalingEnabled;
      
      const response = await axios.post(`${BASE_URL}/toggle_scaling/${clusterName}`, {
        enabled: newScalingState
      });
  
  
      setIsAutomaticScalingEnabled(newScalingState);
      toast.success(`Automatic scaling ${newScalingState ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error(`Failed to toggle scaling: ${error.response?.data?.detail || 'Unknown error'}`);
    } finally {
      setIsLoading(prev => ({ ...prev, scalingToggle: false }));
    }
  };
  // Automatic Node Addition Handler
  const handleAutomaticScaling = async () => {
    try {
      setIsLoading(prev => ({ ...prev, automaticScaling: true }));


      const response = await axios.post(`${BASE_URL}/scale_node/${clusterName}`);


      toast.success(response.data.message || 'Nodes scaled successfully');
    } catch (error) {
      toast.error(`Automatic scaling failed: ${error.response?.data?.detail || 'Unknown error'}`);
    } finally {
      setIsLoading(prev => ({ ...prev, automaticScaling: false }));
    }
  };


  // Manual Node Modal Component
  const ManualNodeModal = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
      ip: '',
      username: '',
      password: '',
      port: '22'
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-lg w-96">
          <h2 className="text-xl font-bold mb-4">Add Manual Node</h2>
          <div className="space-y-4">
            <input
              type="text"
              name="ip"
              placeholder="Node IP"
              value={formData.ip}
              onChange={handleInputChange}
              className="w-full border p-2 rounded"
            />
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full border p-2 rounded"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full border p-2 rounded"
            />
            <input
              type="text"
              name="port"
              placeholder="Port"
              value={formData.port}
              onChange={handleInputChange}
              className="w-full border p-2 rounded"
            />
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button 
              onClick={onClose}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded"
            >
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Add Node
            </button>
          </div>
        </div>
      </div>
    );
  };


  return (
    <div className="relative w-full">
      <div className="flex justify-end items-center space-x-4 mb-4">
        {/* Manual Node Addition Button */}
        <button
          onClick={() => setIsManualNodeModalOpen(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 shadow-md transition-colors"
        >
          Manual Node Addition
        </button>


        {/* Automatic Node Addition Button */}
        <button
          onClick={handleAutomaticScaling}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 shadow-md transition-colors"
          disabled={isLoading.automaticScaling}
        >
          {isLoading.automaticScaling ? 'Adding Nodes...' : 'Automatic Node Addition'}
        </button>
      </div>
      {/* Toggle Button */}
<div className="flex items-center">
  <span className="mr-2">
    {isAutomaticScalingEnabled ? 'Automatic Scaling On' : 'Automatic Scaling Off'}
  </span>
  <button
    onClick={handleToggle}
    disabled={isLoading.scalingToggle}
    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ${
      isAutomaticScalingEnabled ? 'bg-green-500' : 'bg-gray-200'
    } ${isLoading.scalingToggle ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    <span
      className={`transform transition-transform duration-200 absolute left-1 top-1 bg-white w-4 h-4 rounded-full shadow ${
        isAutomaticScalingEnabled ? 'translate-x-5' : ''
      }`}
    />
  </button>
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