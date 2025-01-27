import React, { useState } from 'react';
import {
  useGetClusterMetricsQuery
} from '../features/clusters/clusterApi';
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line
} from 'recharts';
import { ChevronDown } from 'lucide-react';


// Define time range options
const TIME_RANGES = [
  { label: 'Latest', value: 'latest' },
  { label: 'Last Hour', value: '1h' },
  { label: 'Last 6 Hours', value: '6h' },
  { label: 'Last 12 Hours', value: '12h' },
  { label: 'Last 24 Hours', value: '24h' },
  { label: 'Last 7 Days', value: '7d' }
];


export const NodeMetrics = ({ nodeName, clusterName, isVisible }) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('latest');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);


  // Fetch node metrics based on selected time range
  const { data: nodeMetrics, isLoading } = useGetClusterMetricsQuery(
    { clusterName, nodeName, timeRange: selectedTimeRange },
    { skip: !isVisible }
  );


  if (isLoading) {
    return <div>Loading metrics for {nodeName}...</div>;
  }


  if (!nodeMetrics || !nodeMetrics.timestamps || nodeMetrics.timestamps.length === 0) {
    return <div>No metrics data available for {nodeName}</div>;
  }


  const chartData = nodeMetrics.timestamps.map((timestamp, index) => ({
    timestamp,
    cpu: parseFloat(nodeMetrics.cpu_metrics[index] || 0),
    memory: parseFloat(nodeMetrics.memory_metrics[index] || 0),
  })).reverse();


  return (
    <div className="w-full h-[500px] relative">
      {/* Time Range Dropdown */}
      <div className="absolute top-2 right-2 z-10">
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center justify-between w-32 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none"
          >
            <span>{TIME_RANGES.find(range => range.value === selectedTimeRange)?.label}</span>
            <ChevronDown size={16} />
          </button>


          {isDropdownOpen && (
            <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-300 rounded-md shadow-lg z-20">
              {TIME_RANGES.map((range) => (
                <div
                  key={range.value}
                  onClick={() => {
                    setSelectedTimeRange(range.value);
                    setIsDropdownOpen(false);
                  }}
                  className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${selectedTimeRange === range.value ? 'bg-gray-100' : ''}`}
                >
                  {range.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>


      {/* Chart */}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp"  tickFormatter={(timestamp) => {
              // Implement timestamp formatting based on time range
              return formatTimestamp(timestamp, selectedTimeRange);
            }}/>
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="cpu" stroke="#8884d8" name="CPU %" />
          <Line type="monotone" dataKey="memory" stroke="#82ca9d" name="Memory %" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Optional: Timestamp formatting helper
function formatTimestamp(timestamp, timeRange) {
  const date = new Date(timestamp);
  
  switch (timeRange) {
    case 'latest':
      return date.toLocaleTimeString();
    case '1h':
      return date.toLocaleTimeString();
    case '6h':
    case '12h':
      return date.toLocaleString('default', { hour: 'numeric', minute: 'numeric' });
    case '24h':
      return date.toLocaleString('default', { hour: 'numeric', day: 'numeric' });
    case '7d':
      return date.toLocaleString('default', { weekday: 'short', day: 'numeric' });
    default:
      return timestamp;
  }
}

export default NodeMetrics