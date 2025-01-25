import React, { useState, useEffect, useMemo } from 'react';
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
import { useGetPodMetricsQuery } from '../features/clusters/clusterApi';


// Time range options
const TIME_RANGES = [
  { label: 'Latest', value: 'latest' },
  { label: 'Last Hour', value: '1h' },
  { label: 'Last 6 Hours', value: '6h' },
  { label: 'Last 12 Hours', value: '12h' },
  { label: 'Last 24 Hours', value: '24h' },
  { label: 'Last 7 Days', value: '7d' }
];


export const PodMetrics = ({ podName, clusterName, isVisible }) => {
  const [cpuTimeRange, setCpuTimeRange] = useState('latest');
  const [memoryTimeRange, setMemoryTimeRange] = useState('latest');
  const [isCpuDropdownOpen, setIsCpuDropdownOpen] = useState(false);
  const [isMemoryDropdownOpen, setIsMemoryDropdownOpen] = useState(false);


  // Separate queries for CPU and Memory with different time ranges
  const { 
    data: cpuMetrics, 
    isLoading: isCpuLoading, 
    error: cpuError 
  } = useGetPodMetricsQuery(
    { 
      clusterName, 
      podName, 
      timeRange: cpuTimeRange 
    },
    { 
      skip: !isVisible,
      pollingInterval: cpuTimeRange === 'latest' ? 30000 : 0 
    }
  );


  const { 
    data: memoryMetrics, 
    isLoading: isMemoryLoading, 
    error: memoryError 
  } = useGetPodMetricsQuery(
    { 
      clusterName, 
      podName, 
      timeRange: memoryTimeRange 
    },
    { 
      skip: !isVisible,
      pollingInterval: memoryTimeRange === 'latest' ? 30000 : 0 
    }
  );


  // Memoized chart data preparation
  const cpuChartData = useMemo(() => {
    if (!cpuMetrics || !cpuMetrics.timestamps) return [];
    return cpuMetrics.timestamps.map((timestamp, index) => ({
      timestamp,
      cpu: parseFloat(cpuMetrics.cpu_metrics[index] || 0),
    }));
  }, [cpuMetrics]);


  const memoryChartData = useMemo(() => {
    if (!memoryMetrics || !memoryMetrics.timestamps) return [];
    return memoryMetrics.timestamps.map((timestamp, index) => ({
      timestamp,
      memory: parseFloat(memoryMetrics.memory_metrics[index] || 0),
    }));
  }, [memoryMetrics]);


  // Render loading state
  if (isCpuLoading || isMemoryLoading) {
    return (
      <div className="flex items-center justify-center h-[800px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500"></div>
        <span className="ml-4">Loading metrics for {podName}...</span>
      </div>
    );
  }


  // Render error state
  if (cpuError || memoryError) {
    return (
      <div className="text-center text-red-500 h-[800px] flex items-center justify-center">
        Error loading metrics: {cpuError?.toString() || memoryError?.toString()}
      </div>
    );
  }


  // Render no data state
  if (
    !cpuMetrics || !cpuMetrics.timestamps || cpuMetrics.timestamps.length === 0 ||
    !memoryMetrics || !memoryMetrics.timestamps || memoryMetrics.timestamps.length === 0
  ) {
    return (
      <div className="text-center text-gray-500 h-[800px] flex items-center justify-center">
        No metrics data available for {podName}
      </div>
    );
  }
  // Dropdown Component
  const TimeRangeDropdown = ({ 
    isOpen, 
    onToggle, 
    selectedTimeRange, 
    onSelect, 
    label 
  }) => (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-32 px-3 py-2 
        bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 
        rounded-md shadow-sm focus:outline-none"
      >
        <span>{TIME_RANGES.find(range => range.value === selectedTimeRange)?.label}</span>
        <ChevronDown size={16} />
      </button>


      {isOpen && (
        <div className="absolute right-0 mt-1 w-32 
        bg-white dark:bg-gray-800 
        border border-gray-300 dark:border-gray-600 
        rounded-md shadow-lg z-20">
          {TIME_RANGES.map((range) => (
            <div
              key={range.value}
              onClick={() => {
                onSelect(range.value);
                onToggle();
              }}
              className={`px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700
                ${selectedTimeRange === range.value 
                  ? 'bg-gray-100 dark:bg-gray-700' 
                  : ''
                }`}
            >
              {range.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );


  return (
    <div className="w-full h-[800px] flex flex-col">
      {/* CPU Graph */}
      <div className="flex-1 relative">
        <div className="absolute top-2 right-2 z-10">
          <TimeRangeDropdown
            isOpen={isCpuDropdownOpen}
            onToggle={() => setIsCpuDropdownOpen(!isCpuDropdownOpen)}
            selectedTimeRange={cpuTimeRange}
            onSelect={setCpuTimeRange}
            label="CPU Time Range"
          />
        </div>
        <h3 className="text-center font-semibold text-lg mb-2">CPU Usage</h3>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={cpuChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={(timestamp) => formatTimestamp(timestamp, cpuTimeRange)}
            />
            <YAxis 
              label={{ value: 'CPU (Hz)', angle: -90, position: 'insideLeft' }}
              domain={[0, 100]}
            />
            <Tooltip 
              formatter={(value) => [`${value.toFixed(2)}`, 'CPU']}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="cpu" 
              stroke="#8884d8" 
              name="CPU " 
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>


      {/* Memory Graph */}
      <div className="flex-1 relative">
        <div className="absolute top-2 right-2 z-10">
          <TimeRangeDropdown
            isOpen={isMemoryDropdownOpen}
            onToggle={() => setIsMemoryDropdownOpen(!isMemoryDropdownOpen)}
            selectedTimeRange={memoryTimeRange}
            onSelect={setMemoryTimeRange}
            label="Memory Time Range"
          />
        </div>
        <h3 className="text-center font-semibold text-lg mb-2">Memory Usage</h3>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={memoryChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="timestamp" 
              tickFormatter={(timestamp) => formatTimestamp(timestamp, memoryTimeRange)}
            />
            <YAxis 
              label={{ value: 'Memory (Mbi)', angle: -90, position: 'insideLeft' }}
              domain={[0, 100]}
            />
            <Tooltip 
              formatter={(value) => [`${value.toFixed(2)}`, 'Memory']}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="memory" 
              stroke="#82ca9d" 
              name="Memory" 
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};


// Timestamp formatting helper
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