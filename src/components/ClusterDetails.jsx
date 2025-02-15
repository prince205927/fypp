import React, { useState, useEffect, useMemo } from "react";
import {
  Server,
  Box,
  Database,
  Terminal,
  Activity,
  Server as ServerIcon,
  Edit2,
  RefreshCw,
  NetworkIcon,
  Upload,
  ArrowLeft,
  Trash2
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { useParams } from "react-router-dom";
import {
  useGetClusterDetailsQuery,
  useGetPodMetricsQuery,
  useOpenTerminalMutation,
  useGetClusterServicesQuery,
  useDeletePodMutation
} from "../features/clusters/clusterApi";

import { NodeMetrics } from "./NodeMetrics";
import { toast } from "react-hot-toast";
import { ImagesSection } from "./ImagesSection";
import { PodMetrics } from "./PodMetrics";
import { useNavigate } from 'react-router-dom';
import { ServicesComponent } from "./ServicesComponent";
import { ClusterActionButtons } from "./ClusterActionButtons";
import axios from 'axios';
import NodeMetricsTable from "./NodeMetricsTable";

const BASE_URL = 'http://127.0.0.1:8000';

// Colors for charts
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];


// Modal for manual node addition
const ManualNodeModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    masterIp: '',
    masterUsername: '',
    masterPassword: '',
    masterPort: '22',
    workerIp: '',
    workerUsername: '',
    workerPassword: '',
    workerPort: '22'
  });


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };


  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent default form submission behavior
    onSubmit(formData);
    onClose(); // Close modal after submission
};


  return (
    isOpen && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white rounded-lg p-6 w-11/12 max-w-4xl">
          <h2 className="text-xl font-bold mb-4">Manual Node Addition</h2>
          <div>
          
            <input
              type="text"
              name="workerIp"
              placeholder="Worker IP"
              value={formData.workerIp}
              onChange={handleChange}
              className="block w-full mb-2 border border-gray-300 rounded-md p-2"
            />
            <input
              type="text"
              name="workerUsername"
              placeholder="Worker Username"
              value={formData.workerUsername}
              onChange={handleChange}
              className="block w-full mb-2 border border-gray-300 rounded-md p-2"
            />
            <input
              type="password"
              name="workerPassword"
              placeholder="Worker Password"
              value={formData.workerPassword}
              onChange={handleChange}
              className="block w-full mb-2 border border-gray-300 rounded-md p-2"
            />
            <input
              type="text"
              name="workerPort"
              placeholder="Worker Port"
              value={formData.workerPort}
              onChange={handleChange}
              className="block w-full mb-2 border border-gray-300 rounded-md p-2"
            />
          </div>
          <div className="flex justify-between mt-4">
            <button
            type="submit"
              onClick={handleSubmit}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Add Node
            </button>
            <button
            type="button"
              onClick={onClose}
              className="bg-gray-300 text-black px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  );
};


// Main ClusterDetails component
export default function ClusterDetails() {
  const { clusterName } = useParams();
  const [selectedNodeCharts, setSelectedNodeCharts] = useState({});
  const [selectedPodCharts, setSelectedPodCharts] = useState({});
  const [isTerminalModalOpen, setIsTerminalModalOpen] = useState(false);
  const [terminalUrl, setTerminalUrl] = useState("");
  const [isManualNodeModalOpen, setIsManualNodeModalOpen] = useState(false);

  const navigate = useNavigate();
  const [openTerminal] = useOpenTerminalMutation();


  const {
    data: clusterDetails,
    isLoading,
    error,
  } = useGetClusterDetailsQuery(clusterName, {
    skip: !clusterName,
    refetchOnMountOrArgChange: true,
  });


  // Log cluster details for debugging
  useEffect(() => {
    if (clusterDetails) {
      console.log("Cluster Details:", clusterDetails);
    }
  }, [clusterDetails]);


  const handleOpenTerminal = async () => {
    try {
      const response = await openTerminal(clusterName).unwrap();
      setTerminalUrl(response.terminal_url);
      setIsTerminalModalOpen(true);
    } catch (error) {
      console.error("Failed to open terminal:", error);
      toast.error("Failed to open terminal. Please try again.");
    }
  };



  const handleRefreshPage = () => {
    window.location.href = window.location.href; 
  };


  const TerminalModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 w-11/12 max-w-4xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Cluster Terminal</h2>
          <button
            onClick={() => setIsTerminalModalOpen(false)}
            className="text-red-500 hover:text-red-700"
          >
            Close
          </button>
        </div>


        <iframe
          src={terminalUrl}
          width="100%"
          height="600px"
          className="border rounded"
          title="Cluster Terminal"
        />
      </div>
    </div>
  );


  const toggleNodeChart = (nodeName) => {
    setSelectedNodeCharts((prev) => ({
      ...prev,
      [nodeName]: !prev[nodeName],
    }));
  };


  const togglePodChart = (podName) => {
    setSelectedPodCharts((prev) => ({
      ...prev,
      [podName]: !prev[podName],
    }));
  };


  const renderMetricsChart = (podName) => {
    const podStats = clusterDetails.pod_stats?.[podName] || [];
    
    if (!podStats || podStats.length === 0) {
      return (
        <div className="text-center text-gray-500 py-4">
          No metrics data available for {podName}
        </div>
      );
    }


    const chartData = podStats.map((stat) => ({
      timestamp: stat[0],
      cpu: parseFloat(stat[1]),
      memory: parseFloat(stat[2]),
    }));


    return (
      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 50,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="timestamp"
              angle={-45}
              textAnchor="end"
              interval={10}
              height={70}
              tick={{
                fontSize: 10,
                fill: "#666",
              }}
            />
            <YAxis
              label={{
                value: "Usage (%)",
                angle: -90,
                position: "insideLeft",
              }}
              domain={[0, "dataMax + 10"]}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-4 border rounded shadow-lg">
                      <p className="font-bold text-sm">{label}</p>
                      {payload.map((entry, index) => (
                        <p
                          key={index}
                          className="text-sm"
                          style={{ color: entry.color }}
                        >
                          {entry.name}: {entry.value.toFixed(2)}%
                        </p>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend verticalAlign="top" height={36} />
            <Line
              type="monotone"
              dataKey="cpu"
              stroke="#8884d8"
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 6,
                style: {
                  fill: "#8884d8",
                  opacity: 0.7,
                },
              }}
              name="CPU Usage"
            />
            <Line
              type="monotone"
              dataKey="memory"
              stroke="#82ca9d"
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 6,
                style: {
                  fill: "#82ca9d",
                  opacity: 0.7,
                },
              }}
              name="Memory Usage"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };


  const renderOverviewSection = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
          <span className="ml-4">Loading Cluster Details...</span>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Activity className="mr-3" /> Cluster Overview
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="flex items-center">
                <ServerIcon className="mr-2 text-blue-500" size={20} />
                Total Nodes
              </span>
              <span className="font-bold">{clusterDetails.nodes.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center">
                <Box className="mr-2 text-green-500" size={20} />
                Active Pods
              </span>
              <span className="font-bold">{clusterDetails.pods.length}</span>
            </div>
          </div>
        </div>


        <div className="border border-blue-200 rounded-xl shadow-lg overflow-hidden transition-all duration-300 transform">
          <div className="p-6 flex justify-between items-center mb-4">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-500 text-white rounded-full p-3 shadow-md">
                <Terminal className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-blue-900">
                  Cluster Terminal
                </h3>
                <p className="text-blue-600 text-sm">
                  Secure access to your cluster's command line
                </p>
              </div>
            </div>


            <button
              onClick={handleOpenTerminal}
              className="
                flex 
                items-center 
                bg-blue-500 
                text-white 
                px-4 
                py-2 
                rounded-md 
                hover:bg-blue-600 
                transition-colors 
                duration-300 
                group
              "
            >
              <Terminal className="mr-2 h-5 w-5 group-hover:animate-pulse" />
              Open Terminal
            </button>
          </div>
        </div>
      </div>
    );
  };



const[deletePod] =useDeletePodMutation();
const renderPodsSection = () => {
  
  if (!clusterDetails?.pods || clusterDetails.pods.length === 0) return null;

  const handlePodRecreation = async (podName) => {
    const confirmDelete = window.confirm(`Are you sure you want to recreate the pod ${podName}? This action cannot be undone.`);
    
    if (!confirmDelete) return;


    try {
        await deletePod({ clusterName, podName }).unwrap(); 
        toast.success(`Pod ${podName} successfully deleted and recreated`);
    } catch (error) {
        toast.error(`Failed to recreate pod: ${error.message}`);
    }
};
  return (
      <div className="bg-white shadow-lg rounded-lg p-6 mt-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
              <Box className="mr-3" /> Pod Details
          </h2>
          <table className="w-full border-collapse">
              <thead className="bg-gray-100">
                  <tr>
                      <th className="border p-3 text-left">Pod Name</th>
                      <th className="border p-3 text-left">Namespace</th>
                      <th className="border p-3 text-left">Image</th>
                      <th className="border p-3 text-left">Node</th>
                      <th className="border p-3 text-left">Actions</th>
                      <th className="border p-3 text-left">Recreate</th> {/* New Column */}
                  </tr>
              </thead>
              <tbody>
                  {clusterDetails.pods.map((pod, index) => (
                      <React.Fragment key={index}>
                          <tr className="hover:bg-gray-50">
                              <td className="border p-3">{pod.name}</td>
                              <td className="border p-3">{pod.namespace}</td>
                              <td className="border p-3">{pod.image}</td>
                              <td className="border p-3">{pod.node}</td>
                              <td className="border p-3">
                                  <button
                                      onClick={() => togglePodChart(pod.name)}
                                      className="text-blue-600 hover:text-blue-800"
                                  >
                                      {selectedPodCharts[pod.name] ? "Hide Chart" : "Show Chart"}
                                  </button>
                              </td>
                              <td className="border p-3">
                                  <button
                                      onClick={() => handlePodRecreation(pod.name)}
                                      className="text-red-500 hover:text-red-700 transition-colors"
                                      title="Recreate Pod"
                                  >
                                      <Trash2 size={20} />
                                  </button>
                              </td>
                          </tr>
                          {selectedPodCharts[pod.name] && (
                              <tr>
                                  <td colSpan="6" className="p-4">
                                      <PodMetrics
                                          podName={pod.name}
                                          clusterDetails={clusterDetails} // Pass clusterDetails here
                                          isVisible={selectedPodCharts[pod.name]}
                                      />
                                  </td>
                              </tr>
                          )}
                      </React.Fragment>
                  ))}
              </tbody>
          </table>
      </div>
  );
};

 
  const renderResourceCharts = () => {
    if (!clusterDetails) return null;


    // Node Distribution
    const nodeDistributionData = clusterDetails.nodes.map((node) => ({
      name: node.name,
      pods: clusterDetails.pods.filter((pod) => pod.node === node.name).length,
    }));


    // Image Distribution
    const imageDistributionData = clusterDetails.pods.reduce((acc, pod) => {
      const existingImage = acc.find(item => item.name === pod.image);
      if (existingImage) {
        existingImage.count += 1;
      } else {
        acc.push({ name: pod.image, count: 1 });
      }
      return acc;
    }, []);


    // Overall Resource Composition
    const totalResources = clusterDetails.pods.length + clusterDetails.nodes.length + imageDistributionData.length;


    const resourceCompositionData = [
      {
        name: "Pods",
        value: clusterDetails.pods.length,
        percentage: ((clusterDetails.pods.length / totalResources) * 100).toFixed(2)
      },
      {
        name: "Nodes",
        value: clusterDetails.nodes.length,
        percentage: ((clusterDetails.nodes.length / totalResources) * 100).toFixed(2)
      },
      {
        name: "Images",
        value: imageDistributionData.length,
        percentage: ((imageDistributionData.length / totalResources) * 100).toFixed(2)
      }
    ];

    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
          <span className="ml-4">Loading Cluster Details...</span>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Node Distribution</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={nodeDistributionData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="pods"
              nameKey="name"
            >
              {nodeDistributionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              content={({ payload }) => {
                if (!payload || payload.length === 0) return null;
                const data = payload[0];
                return (
                  <div className="bg-white p-3 shadow-lg rounded">
                    <p className="font-bold">{data.name}</p>
                    <p>Pods: {data.value}</p>
                  </div>
                );
              }}
            />
            <Legend layout="vertical" verticalAlign="middle" align="right" />
          </PieChart>
        </ResponsiveContainer>
      </div>

              


      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Image Distribution</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={imageDistributionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip
              cursor={{ fill: "rgba(0, 0, 0, 0.1)" }}
              content={({ payload }) => {
                if (!payload || payload.length === 0) return null;
                const data = payload[0];
                return (
                  <div className="bg-white p-3 shadow-lg rounded">
                    <p className="font-bold">{data.payload.name}</p>
                    <p>Replicas: {data.value}</p>
                  </div>
                );
              }}
            />
            <Bar dataKey="count" fill="#8884d8">
              {imageDistributionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>




      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Overall Resource Composition</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={resourceCompositionData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
            >
              {resourceCompositionData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              content={({ payload }) => {
                if (!payload || payload.length === 0) return null;
                const data = payload[0];
                return (
                  <div className="bg-white p-3 shadow-lg rounded">
                    <p className="font-bold">{data.payload.name}</p>
                    <p>Total Count: {data.value}</p>
                    <p>Percentage: {data.payload.percentage}%</p>
                  </div>
                );
              }}
            />
            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              formatter={(value, entry) => {
                const data = entry.payload;
                return `${value} (${data.percentage}%)`;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};



return (
  isLoading ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70 dark:bg-black/70 backdrop-blur-sm">
      <div className="flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 mb-4"></div>
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Loading Cluster Details
        </h2>
        
      </div>
    </div>
  ) : (
    <div className="p-6 space-y-6">
      <div className="flex items-center mb-6 space-x-4">
        {/* Go Back Button */}
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>

        <div className="flex-1 flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            Cluster Details: {clusterName}
          </h1>

          {/* Refresh Button */}
          <button 
            onClick={handleRefreshPage}
            className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center space-x-2"
          >
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {isTerminalModalOpen && <TerminalModal />}
      {renderOverviewSection()}
      {renderResourceCharts()}
      {/* {renderActions()} */}
      <ClusterActionButtons 
        clusterName={clusterName} 
      
      />
      {/* {renderNodeMetrics()} */}
      <NodeMetricsTable 
        clusterDetails={clusterDetails}
        clusterName={clusterName}
        selectedNodeCharts={selectedNodeCharts}
        toggleNodeChart={toggleNodeChart}
      />
      {renderPodsSection()}
      {clusterDetails && (
        <ImagesSection 
          clusterDetails={clusterDetails} 
          clusterName={clusterName} 
        />
      )}
      {isManualNodeModalOpen && (
        <ManualNodeModal
          isOpen={isManualNodeModalOpen}
          onClose={() => setIsManualNodeModalOpen(false)}
          onSubmit={handleManualNodeAdd} // Call the function to add the node
        />
      )}
      <ServicesComponent clusterName={clusterName} />
    </div>
  )
);
}
