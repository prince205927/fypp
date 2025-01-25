import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom';
import { 
  Settings, 
  Server, 
  User, 
  Grid, 
  Plus, 
  X, 
  Moon, 
  Sun ,
  Trash2
} from 'lucide-react';
import { toast } from 'react-toastify';
import { 
  useGetClustersQuery, 
  useAddClusterMutation,
  useDeleteClusterMutation,
  useGetClusterDetailsQuery
} from '../features/clusters/clusterApi';
import ClusterCardWithDetails from './ClusterCardWithDetails';


export default function MonitoringDashboard() {
  const navigate = useNavigate();
  const { 
    data: clusters = [], 
    isLoading 
  } = useGetClustersQuery();
  


 




  const [deleteCluster] = useDeleteClusterMutation();
  const [isAddClusterModalOpen, setIsAddClusterModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);


  // Effect to handle dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const handleDeleteCluster = async (clusterName) => {
    
    try {
        // Validate clusterName before deletion
        if (!clusterName || typeof clusterName !== 'string') {
            toast.error('Invalid cluster selected');
            return;
        }


        const confirmDelete = window.confirm(`Are you sure you want to delete the cluster '${clusterName}'?`);
        
        if (confirmDelete) {
            await deleteCluster(clusterName).unwrap();
            // Success toast is handled in the mutation
        }
    } catch (error) {
        console.error('Delete cluster error:', error);
        
        // More specific error handling
        if (error.status === 404) {
            toast.error(`Cluster '${clusterName}' not found`);
        } else {
            toast.error('Failed to delete cluster');
        }
    }
};
 

  

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
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
      <div className={`flex flex-col h-screen ${isDarkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50'}`}>
        {/* Top Navigation */}
        <nav className={`flex items-center justify-between p-4 border-b ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center space-x-4">
          
            
            <div className="flex space-x-2">
              <Link 
                to="/dashboard" 
                className={`px-3 py-2 rounded-md flex items-center space-x-2 ${
                  location.pathname === '/dashboard'
                    ? (isDarkMode 
                        ? 'bg-gray-700 text-white' 
                        : 'bg-gray-200 text-gray-800')
                    : (isDarkMode 
                        ? 'hover:bg-gray-700 text-gray-300' 
                        : 'hover:bg-gray-100 text-gray-600')
                }`}
              >
                <Grid size={16} />
                <span>Overview</span>
              </Link>
              
              <Link 
                to="/jenkins" 
                className={`px-3 py-2 rounded-md flex items-center space-x-2 ${
                  location.pathname === '/jenkins'
                    ? (isDarkMode 
                        ? 'bg-gray-700 text-white' 
                        : 'bg-gray-200 text-gray-800')
                    : (isDarkMode 
                        ? 'hover:bg-gray-700 text-gray-300' 
                        : 'hover:bg-gray-100 text-gray-600')
                }`}
              >
                <Server size={16} />
                <span>Jenkins</span>
              </Link>
            </div>
          </div>
          
          
        </nav>
    


      {/* Main Content */}
      <main className={`flex-1 p-8 relative ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50'}`}>
        <div className="flex justify-between items-center mb-8">
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            System Monitoring
          </h2>
          
          <div className="flex items-center">
            <button 
              onClick={toggleDarkMode} 
              className={`p-2 rounded-full ${isDarkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>


            <button 
              onClick={() => setIsAddClusterModalOpen(true)}
              className={`ml-4 flex items-center gap-2 px-4 py-2 rounded-lg 
                ${isDarkMode 
                  ? 'bg-purple-700 text-white hover:bg-purple-600' 
                  : 'bg-purple-600 text-white hover:bg-purple-700'
                } transition`}
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
              darkMode={isDarkMode}
              navigate={navigate}
            />
          ))}
        </div>


        {/* Add Cluster Modal */}
        {isAddClusterModalOpen && (
          <AddClusterModal 
            onClose={() => setIsAddClusterModalOpen(false)} 
            darkMode={isDarkMode}
          />
        )}
      </main>
    </div>
  )
}


// NavItem Component
function NavItem({ icon, label, href, active = false, darkMode }) {
  return (
    <Link 
      to={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer no-underline ${
        darkMode 
          ? (active 
              ? 'bg-purple-900 text-purple-300' 
              : 'text-gray-300 hover:bg-gray-800') 
          : (active 
              ? 'bg-purple-50 text-purple-600' 
              : 'text-gray-600 hover:bg-gray-50')
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </Link>
  )
}


// SystemCard Component
function SystemCard({ 
  id,  // Use id for navigation
  name, 
  status, 
  details,
  cpu, 
  memory, 
  isLoading: isDetailsLoading,
  nodes, 
  pods, 
  image, 
  onDelete, 
  darkMode,
  navigate  // Add navigate prop
}) {
  const [deleteCluster] = useDeleteClusterMutation();
  const [isDeleting, setIsDeleting] = useState(false);
  const handleCardClick = () => {
    // Navigate to cluster details when card is clicked
    navigate(`/dashboard/clusters/${id}`);
  };
  const handleDeleteClick = async (e) => {
    // Stop event propagation to prevent card navigation
    e.stopPropagation();
    
    try {
      // Validate cluster name
      if (!name || typeof name !== 'string') {
        toast.error('Invalid cluster selected');
        return;
      }


      // Confirm deletion
      const confirmDelete = window.confirm(`Are you sure you want to delete the cluster '${name}'?`);
      
      if (confirmDelete) {
        setIsDeleting(true);


        // Use the RTK Query mutation
        await deleteCluster(name).unwrap();
        
        // Note: Success toast is handled in the mutation
      }
    } catch (error) {
      // Error handling is now primarily in the mutation
      console.error('Delete attempt failed', error);
    } finally {
      setIsDeleting(false);
    }
  };


  const getStatusColor = (status) => {
    switch (status) {
      case 'Operational': return darkMode ? 'text-green-400' : 'text-green-600'
      case 'Maintenance': return darkMode ? 'text-yellow-400' : 'text-yellow-600'
      case 'Offline': return darkMode ? 'text-red-400' : 'text-red-600'
      default: return darkMode ? 'text-gray-400' : 'text-gray-600'
    }
  }
  const LoadingMetric = () => (
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-8"></div>
  );

  return (
   <div>
    <div 
      className={`
        border rounded-lg p-6 
        ${darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
        } 
        hover:shadow-md transition-shadow
        cursor-pointer  // Make the entire card clickable
      `}
      onClick={handleCardClick}
    >
      <div className="mb-4 flex justify-between items-start">
        <div>
          <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {name.includes('System') ? name : `Cluster: ${name}`}
          </h3>
          <div className={`text-sm font-medium ${getStatusColor(status)}`}>
            Status: {status}
          </div>
        </div>
       {/* Trash Icon Button */}
       <button 
          onClick={handleDeleteClick}
          className={`
            p-2 rounded-full hover:bg-red-100 transition-colors
            ${darkMode 
              ? 'text-red-400 hover:bg-red-900' 
              : 'text-red-500 hover:bg-red-50'
            }
          `}
          aria-label="Delete Cluster"
        >
          <Trash2 
            size={20} 
            className={`
              ${darkMode 
                ? 'hover:text-red-300' 
                : 'hover:text-red-600'
              }
            `}
          />
        </button>
      </div>
 
        
   


      <div className="space-y-3 mb-4">
        <MetricRow 
          label="CPU" 
          value={
            isDetailsLoading ? (
              <LoadingMetric />
            ) : (
              `${cpu}%`
            )
        
          } 
          darkMode={darkMode} 
        />
        <MetricRow 
  label="Memory" 
  value={
    isDetailsLoading ? (
      <LoadingMetric />
    ) : (
      `${memory}%`
    )
  } 
  darkMode={darkMode} 
/>
       <MetricRow 
          label="Nodes" 
          value={
            isDetailsLoading ? (
              <LoadingMetric />
            ) : (
              <div className="flex items-center">
                <span>{details?.nodes?.length || 0}</span>
                
              </div>
            )
          } 
          darkMode={darkMode} 
        />
         <MetricRow 
          label="Pods" 
          value={
            isDetailsLoading ? (
              <LoadingMetric />
            ) : (
              <div className="flex items-center">
                <span>{details?.pods?.length || 0}</span>
                
              </div>
            )
          } 
          darkMode={darkMode} 
        />
        {image && (
          <MetricRow 
            label="Image" 
            value={image} 
            darkMode={darkMode} 
          />
        )}
      </div>
    </div>
    </div>
  )
}

// MetricRow Component
function MetricRow({ label, value, darkMode }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        {label}
      </span>
      <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
        {value}
      </span>
    </div>
  )
}


// AddClusterModal Component
function AddClusterModal({ onClose, darkMode }) {
  const [addCluster,{ isLoading, error }] = useAddClusterMutation()
  const [clusterData, setClusterData] = useState({
    name: '',
    ip: '',
    port: 22,
    username: '',
    password: '',
    interval: 30
  })


  const handleChange = (e) => {
    const { name, value } = e.target
    setClusterData(prev => ({
      ...prev,
      [name]: value
    }))
  }


  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await addCluster(clusterData).unwrap()
      toast.success('Cluster added successfully')
      onClose()
    } catch (error) {
      console.error('Failed to add cluster:', error)
      toast.error('Failed to add cluster')
    }
  }


  return (
    <div className={`
      fixed inset-0 bg-black bg-opacity-50 
      flex items-center justify-center z-50
    `}>
      <div className={`
        rounded-lg shadow-xl w-full max-w-md p-6 
        ${darkMode 
          ? 'bg-gray-800 text-white' 
          : 'bg-white text-gray-800'
        }
      `}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Add New Cluster</h2>
          <button 
            onClick={onClose}
            className={`
              ${darkMode 
                ? 'text-gray-300 hover:text-white' 
                : 'text-gray-600 hover:text-gray-800'
              }
            `}
          >
            <X size={24} />
          </button>
        </div>


        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label 
              htmlFor="name" 
              className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Cluster Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={clusterData.name}
              onChange={handleChange}
              className={`
                mt-1 block w-full rounded-md shadow-sm py-2 px-3
                ${darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'border-gray-300'
                }
              `}
              placeholder="Enter cluster name"
            />
          </div>


          <div>
            <label 
              htmlFor="ip" 
              className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Master Node IP
            </label>
            <input
              type="text"
              id="ip"
              name="ip"
              required
              value={clusterData.ip}
              onChange={handleChange}
              className={`
                mt-1 block w-full rounded-md shadow-sm py-2 px-3
                ${darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'border-gray-300'
                }
              `}
              placeholder="Enter master node IP"
            />
          </div>


          <div>
            <label 
              htmlFor="port" 
              className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              SSH Port
            </label>
            <input
              type="number"
              id="port"
              name="port"
              required
              value={clusterData.port}
              onChange={handleChange}
              className={`
                mt-1 block w-full rounded-md shadow-sm py-2 px-3
                ${darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'border-gray-300'
                }
              `}
              placeholder="Enter SSH port (default: 22)"
            />
          </div>


          <div>
            <label 
              htmlFor="username" 
              className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              required
              value={clusterData.username}
              onChange={handleChange}
              className={`
                mt-1 block w-full rounded-md shadow-sm py-2 px-3
                ${darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'border-gray-300'
                }
              `}
              placeholder="Enter SSH username"
            />
          </div>


          <div>
            <label 
              htmlFor="password" 
              className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              value={clusterData.password}
              onChange={handleChange}
              className={`
                mt-1 block w-full rounded-md shadow-sm py-2 px-3
                ${darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'border-gray-300'
                }
              `}
              placeholder="Enter SSH password"
            />
          </div>




          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className={`
                px-4 py-2 rounded-md
                ${darkMode 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`
                px-4 py-2 rounded-md
                ${darkMode 
                  ? 'bg-purple-700 text-white hover:bg-purple-600' 
                  : 'bg-purple-600 text-white hover:bg-purple-700'
                }
                ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {isLoading ? 'Adding...' : 'Add Cluster'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}


// Export the components
export { 
  NavItem, 
  SystemCard, 
  MetricRow, 
  AddClusterModal 
}


