import {  useGetBuildReportQuery, useGetClusterDetailsQuery, useGetClusterMetricsQuery } from '../features/clusters/clusterApi'
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line } from 'recharts';
export const NodeMetrics = ({ nodeName, clusterName, isVisible }) => {
    const { data: nodeMetrics, isLoading } = useGetClusterMetricsQuery(
      { clusterName, nodeName },
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
      <div className="w-full h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
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