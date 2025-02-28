import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { Settings, Server, User, Grid, Plus, X, Trash2, PlusCircle, LogOut } from 'lucide-react';
import { toast } from 'react-toastify';
import { useGetClustersQuery, useAddClusterMutation, useDeleteClusterMutation } from '../features/clusters/clusterApi';
import ClusterCardWithDetails from './ClusterCardWithDetails';

function UserProfileModal({ onClose, onLogout, username, role }) {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md z-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-bold">User Profile</h3>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-lg font-medium text-gray-800">{username}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                role === 'superadmin' 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {role}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {role === 'superadmin' && (
            <div>
              <button
                onClick={() => navigate('/signup')}
                className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                <PlusCircle size={16} />
                Add New Account
              </button>
            </div>
          )}

          <div>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
            >
              <LogOut size={16} />
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default function MonitoringDashboard() {
  const navigate = useNavigate();
  const { data: clusters = [], isLoading } = useGetClustersQuery();
  const [username, setUsername] = useState('Guest'); 
  const [deleteCluster] = useDeleteClusterMutation();
  const [isAddClusterModalOpen, setIsAddClusterModalOpen] = useState(false);
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
  
    if (storedUsername) {
      setUsername(storedUsername);
    }

  }, []);
  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('username');
    setUsername('Guest');
    navigate('/login');
  };
  
  const handleDeleteCluster = async (clusterName) => {
    try {
      if (!clusterName || typeof clusterName !== 'string') {
        toast.error('Invalid cluster selected');
        return;
      }

      const confirmDelete = window.confirm(`Are you sure you want to delete the cluster '${clusterName}'?`);

      if (confirmDelete) {
        await deleteCluster(clusterName).unwrap();
      }
    } catch (error) {
      console.error('Delete cluster error:', error);
      if (error.status === 404) {
        toast.error(`Cluster '${clusterName}' not found`);
      } else {
        toast.error('Failed to delete cluster');
      }
    }
  };
 
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
        <span className="ml-4">Loading Available Clusters...</span>
      </div>
    );
  }

  return (
  
    <div className="flex flex-col h-screen">
      {/* Top Navigation */}
      <nav className="flex items-center justify-between p-4 border-b bg-white border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2">
            <Link
              to="/dashboard"
              className={`px-3 py-2 rounded-md flex items-center space-x-2 ${location.pathname === '/dashboard' ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              <Grid size={16} />
              <span>Overview</span>
            </Link>
            <Link
              to="/jenkins"
              className={`px-3 py-2 rounded-md flex items-center space-x-2 ${location.pathname === '/jenkins' ? 'bg-gray-200 text-gray-800' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              <Server size={16} />
              <span>Jenkins</span>
            </Link>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition"
          >
            <User size={20} />
            Profile
          </button>
        </div>
      </nav>

      {isModalOpen && (
  <UserProfileModal
    onClose={() => setIsModalOpen(false)}
    onLogout={handleLogout}
    username={username}
    role={localStorage.getItem('userRole')} // Make sure to store role during login
  />
)}

      {/* Main Content */}
      <main className="flex-1 p-8 relative bg-gray-50">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">
            System Monitoring
          </h2>
          <div className="flex items-center">
            <button
              onClick={() => setIsAddClusterModalOpen(true)}
              className="ml-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition"
            >
              <Plus size={20} />
              Add New Cluster
            </button>
          </div>
        </div>

        {/* Clusters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {clusters.map((cluster) => (
            <ClusterCardWithDetails
              key={cluster.id}
              cluster={cluster}
              onDelete={handleDeleteCluster}
              navigate={navigate}
            />
          ))}
        </div>

        {/* Add Cluster Modal */}
        {isAddClusterModalOpen && (
          <AddClusterModal
            onClose={() => setIsAddClusterModalOpen(false)}
          />
        )}
      </main>
    </div>
  );
}

// NavItem Component
function NavItem({ icon, label, href, active = false }) {
  return (
    <Link
      to={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer no-underline ${active ? 'bg-purple-50 text-purple-600' : 'text-gray-600 hover:bg-gray-50'}`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}

// SystemCard Component
function SystemCard({ id, name, status, details, cpu, memory, isLoading: isDetailsLoading, nodes, pods, image, onDelete, navigate }) {
  const [deleteCluster] = useDeleteClusterMutation();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCardClick = () => {
    navigate(`/dashboard/clusters/${id}`);
  };

  const handleDeleteClick = async (e) => {
    e.stopPropagation();

    if (!name || typeof name !== 'string') {
      toast.error('Invalid cluster selected');
      return;
    }

    const confirmDelete = window.confirm(`Are you sure you want to delete the cluster '${name}'?`);

    if (confirmDelete) {
      setIsDeleting(true);

      try {
        await deleteCluster(name).unwrap();
      } catch (error) {
        console.error('Delete attempt failed', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Operational': return 'text-green-600';
      case 'Maintenance': return 'text-yellow-600';
      case 'Offline': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const LoadingMetric = () => (
    <div className="h-4 bg-gray-200 rounded animate-pulse w-8"></div>
  );

  return (
    <div
      className="border rounded-lg p-6 bg-white border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="mb-4 flex justify-between items-start">
        <div>
          <h3 className="text-lg font-medium text-gray-800">
            {name.includes('System') ? name : `Cluster: ${name}`}
          </h3>
          <div className={`text-sm font-medium ${getStatusColor(status)}`}>
            Status: {status}
          </div>
        </div>
        <button
          onClick={handleDeleteClick}
          className="p-2 rounded-full hover:bg-red-50 text-red-500 hover:bg-red-50"
          aria-label="Delete Cluster"
        >
          <Trash2 size={20} className="hover:text-red-600" />
        </button>
      </div>

      <div className="space-y-3 mb-4">
        <MetricRow label="CPU" value={isDetailsLoading ? <LoadingMetric /> : `${cpu}%`} />
        <MetricRow label="Memory" value={isDetailsLoading ? <LoadingMetric /> : `${memory}%`} />
        <MetricRow label="Nodes" value={isDetailsLoading ? <LoadingMetric /> : <span>{details?.nodes?.length || 0}</span>} />
        <MetricRow label="Pods" value={isDetailsLoading ? <LoadingMetric /> : <span>{details?.pods?.length || 0}</span>} />
        {image && <MetricRow label="Image" value={image} />}
      </div>
    </div>
  );
}

// MetricRow Component
function MetricRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value}</span>
    </div>
  );
}

// AddClusterModal Component
function AddClusterModal({ onClose }) {
  const [addCluster, { isLoading, error }] = useAddClusterMutation();
  const [clusterData, setClusterData] = useState({
    name: '',
    ip: '',
    port: 22,
    username: '',
    password: '',
    interval: 30
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setClusterData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addCluster(clusterData).unwrap();
      toast.success('Cluster added successfully');
      onClose();
    } catch (error) {
      console.error('Failed to add cluster:', error);
      toast.error('Failed to add cluster');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="rounded-lg shadow-xl w-full max-w-md p-6 bg-white text-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Add New Cluster</h2>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Cluster Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={clusterData.name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md shadow-sm py-2 px-3 border-gray-300"
              placeholder="Enter cluster name"
            />
          </div>

          <div>
            <label htmlFor="ip" className="block text-sm font-medium text-gray-700">
              Master Node IP
            </label>
            <input
              type="text"
              id="ip"
              name="ip"
              required
              value={clusterData.ip}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md shadow-sm py-2 px-3 border-gray-300"
              placeholder="Enter master node IP"
            />
          </div>

          <div>
            <label htmlFor="port" className="block text-sm font-medium text-gray-700">
              SSH Port
            </label>
            <input
              type="number"
              id="port"
              name="port"
              required
              value={clusterData.port}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md shadow-sm py-2 px-3 border-gray-300"
              placeholder="Enter SSH port (default: 22)"
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              required
              value={clusterData.username}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md shadow-sm py-2 px-3 border-gray-300"
              placeholder="Enter SSH username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              value={clusterData.password}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md shadow-sm py-2 px-3 border-gray-300"
              placeholder="Enter SSH Password"
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 rounded-md bg-purple-600 text-white hover:bg-purple-700 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? 'Adding...' : 'Add Cluster'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Export the components
export { NavItem, SystemCard, MetricRow, AddClusterModal };
