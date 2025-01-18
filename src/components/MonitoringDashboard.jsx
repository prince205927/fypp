import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Settings, 
  Server, 
  Bell, 
  User, 
  Grid, 
  ChevronDown,
  Plus,
  X
} from 'lucide-react'
import { 
  useGetClustersQuery, 
  useAddClusterMutation,
} from '../features/clusters/clusterApi'

export default function MonitoringDashboard() {
  const { 
    data: clusters = [], 
    isLoading, 
    error 
  } = useGetClustersQuery()


  // State for managing the modal
  const [isAddClusterModalOpen, setIsAddClusterModalOpen] = useState(false)


  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-8">
          <div className="h-6 w-6 bg-purple-600 rounded transform rotate-45" />
          <h1 className="text-xl font-semibold">Cluster Monitor</h1>
        </div>
        
        <nav className="space-y-1">
          <NavItem icon={<Grid size={20} />} label="Overview" href="/dashboard" active={true} />
          <NavItem icon={<Server size={20} />} label="Jenkins" href="/jenkins" />
          <NavItem icon={<Bell size={20} />} label="Scaling" href="/scaling" />
          <NavItem icon={<User size={20} />} label="Account" href="/account" />
          <NavItem icon={<Settings size={20} />} label="Settings" href="/settings" />
        </nav>
      </aside>


      {/* Main Content */}
      <main className="flex-1 p-8 relative">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">System Monitoring</h2>
          <button 
            onClick={() => setIsAddClusterModalOpen(true)}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            <Plus size={20} />
            Add New Cluster
          </button>
        </div>


        {/* Existing clusters grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {clusters.map((system) => (
            <Link 
              key={system.id} 
              to={`/dashboard/clusters/${system.id}`}
              className="no-underline"
            >
              <SystemCard {...system} />
            </Link>
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
  )
}


function AddClusterModal({ onClose }) {
  const [addCluster, { isLoading, error }] = useAddClusterMutation()
  
  // Form state
  const [clusterData, setClusterData] = useState({
    name: '',
    ip: '',
    port: 22,
    username: '',
    password: '',
    interval: 30 // default interval
  })


  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setClusterData(prev => ({
      ...prev,
      [name]: value
    }))
  }


  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await addCluster(clusterData).unwrap()
      onClose() // Close modal on success
    } catch (submitError) {
      console.error('Failed to add cluster:', submitError)
      // Error handling will be managed by the mutation
    }
  }


  return (
    
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>


        <h2 className="text-xl font-semibold mb-4">Add New Cluster</h2>


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
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
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
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
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
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
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
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
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
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              placeholder="Enter SSH password"
            />
          </div>




          {/* Error handling */}
          {error && (
            <div className="text-red-500 text-sm">
              {error.data?.detail || 'Failed to add cluster'}
            </div>
          )}


          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              {isLoading ? "Adding..." : "Add Cluster"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
function NavItem({ icon, label, href, active = false }) {
  return (
    <Link 
      to={href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer no-underline ${
        active ? 'bg-purple-50 text-purple-600' : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </Link>
  )
}

function SystemCard({ name, status, cpu, memory, nodes, pods, image }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'Operational': return 'text-green-600'
      case 'Maintenance': return 'text-yellow-600'
      case 'Offline': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }


  return (
    <div className="border rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer">
      <div className="mb-4">
        <h3 className="text-lg font-medium">
          {name.includes('System') ? name : `Cluster Name: ${name}`}
        </h3>
        <div className={`text-sm font-medium ${getStatusColor(status)}`}>
          Status: {status}
        </div>
      </div>


      <div className="space-y-3">
        <MetricRow label="CPU" value={`${cpu}%`} />
        <MetricRow label="Memory" value={`${memory}%`} />
        <MetricRow label="No of Nodes" value={nodes.toString()} />
        <MetricRow label="No of Pods" value={pods.toString()} />
        {image && <MetricRow label="Image used" value={image} />}
      </div>
    </div>
  )
}


function MetricRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}