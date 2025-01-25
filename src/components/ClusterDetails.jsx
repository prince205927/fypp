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
  useGetClusterServicesQuery
} from "../features/clusters/clusterApi";
import { NodeMetrics } from "./NodeMetrics";
import { toast } from "react-toastify";
import { ImagesSection } from "./ImagesSection";
import { PodMetrics } from "./PodMetrics";


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


  const renderPodsSection = () => {
    if (!clusterDetails?.pods || clusterDetails.pods.length === 0) return null;


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
                            </tr>
                            {selectedPodCharts[pod.name] && (
                                <tr>
                                    <td colSpan="5" className="p-4">
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

const renderServicesSection = () => {
  const { 
    data: servicesData, 
    isLoading, 
    error 
  } = useGetClusterServicesQuery({ clusterName });


  // Process services with service links
  const processedServices = useMemo(() => {
    if (!servicesData) return [];


    return servicesData.services.map(service => ({
      ...service,
      serviceLink: service.type !== 'ClusterIP' && service.ports
        ? `http://${servicesData.cluster_ip}:${service.ports}` // Use the port directly
        : null
    }));
  }, [servicesData]);


  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <NetworkIcon className="mr-3" /> Services
        </h2>
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-blue-500"></div>
        </div>
      </div>
    );
  }


  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <NetworkIcon className="mr-3" /> Services
        </h2>
        <p className="text-red-500">Error loading services: {error.message}</p>
      </div>
    );
  }


  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-4 flex items-center">
        <NetworkIcon className="mr-3" /> Services
      </h2>
      <table className="w-full border-collapse">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-3 text-left">Name</th>
            <th className="border p-3 text-left">Type</th>
            <th className="border p-3 text-left">Cluster IP</th>
            <th className="border p-3 text-left">Ports</th>
            <th className="border p-3 text-left">Service Link</th>
          </tr>
        </thead>
        <tbody>
          {processedServices.length === 0 ? (
            <tr>
              <td colSpan="5" className="border p-3 text-center text-gray-500">
                No services found
              </td>
            </tr>
          ) : (
            processedServices.map((service, index) => (
              <tr 
                key={index} 
                className="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="border p-3">{service.name}</td>
                <td className="border p-3">{service.type}</td>
                <td className="border p-3">{service.clusterIP}</td>
                <td className="border p-3">{service.ports || 'N/A'}</td>
                <td className="border p-3">
                  {service.serviceLink ? (
                    <a 
                      href={service.serviceLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Access Service
                    </a>
                  ) : (
                    'N/A'
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
  const renderNodeMetrics = () => {
    if (!clusterDetails?.nodes || clusterDetails.nodes.length === 0) return null;


    return (
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4 flex items-center">
          <Server className="mr-3" /> Cluster Node Metrics
        </h2>
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-3 text-left">Node Name</th>
              <th className="border p-3 text-left">Status</th>
              <th className="border p-3 text-left">Roles</th>
              <th className="border p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clusterDetails.nodes.map((node, index) => (
              <React.Fragment key={index}>
                <tr className="hover:bg-gray-50">
                  <td className="border p-3">{node.name}</td>
                  <td className="border p-3">{node.status}</td>
                  <td className="border p-3">{node.roles}</td>
                  <td className="border p-3">
                    <button
                      onClick={() => toggleNodeChart(node.name)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {selectedNodeCharts[node.name] ? "Hide Chart" : "Show Chart"}
                    </button>
                  </td>
                </tr>
                {selectedNodeCharts[node.name] && (
                  <tr>
                    <td colSpan="4" className="p-4">
                      <NodeMetrics
                        nodeName={node.name}
                        clusterName={clusterName}
                        isVisible={selectedNodeCharts[node.name]}
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

const renderActions = () => {
  return (
    <div className="relative w-full h-12"> {/* Fixed height container */}
      <div className="absolute right-[24px]  bottom-[-80px] flex items-center z-10">
        <div className="flex space-x-4">
          <button
            onClick={() => setIsManualNodeModalOpen(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 shadow-md transition-colors"
          >
            Manual Node Addition
          </button>
          <button
            onClick={handleAutomaticScaling}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 shadow-md transition-colors"
          >
            Automatic Node Addition
          </button>
        </div>
      </div>
    </div>
  );
};


const handleAutomaticScaling = async () => {
  try {
      const response = await axios.post('/api/scale/automatic', {
          master_ip: automaticScaling.masterIp,
          username_master: automaticScaling.masterUsername,
          password_master: automaticScaling.masterPassword,
          port_master: automaticScaling.masterPort
      });
      toast.success(response.data.message);
  } catch (error) {
      toast.error(`Automatic scaling failed: ${error.response?.data?.detail || 'Unknown error'}`);
  }
};

const handleManualNodeAdd = async (formData) => {
  try {
      const response = await axios.post('/api/add-node', {
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
  } catch (error) {
      toast.error(`Failed to add node: ${error.response?.data?.detail || 'Unknown error'}`);
  }
};
// Render the main component

return (
  <div className="p-6 space-y-6">
       {/* Add the action buttons here */}
       {isTerminalModalOpen && <TerminalModal />}
      {renderOverviewSection()}
      {renderResourceCharts()}
      {renderActions()}
      {renderNodeMetrics()}
      
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
              onSubmit={handleManualNodeAdd} 
          />
      )}
      {renderServicesSection()}
  </div>
);
}

