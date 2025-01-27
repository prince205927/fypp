// NodeMetricsTable.js
import React, { useState } from 'react';
import { Trash2, Server } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useDeleteNodeMutation } from '../features/clusters/clusterApi'; // Adjust the import path
import NodeMetrics from './NodeMetrics';


const NodeMetricsTable = ({ 
  clusterDetails, 
  clusterName, 
  toggleNodeChart, 
  selectedNodeCharts 
}) => {
  // Use the RTK Query mutation for node deletion
  const [deleteNode, { isLoading: isDeleting }] = useDeleteNodeMutation();


  // Confirmation and Deletion Handler
  const handleNodeDeletion = async (nodeName) => {
    // Prevent deletion of control-plane nodes
    if (nodeName.includes('master') || nodeName.includes('control-plane')) {
      toast.error('Cannot delete control-plane nodes');
      return;
    }


    // Show confirmation dialog
    const confirmDelete = window.confirm(
      `Are you sure you want to remove the node ${nodeName}? This action cannot be undone.`
    );


    if (!confirmDelete) return;


    try {
      // Perform node deletion
      const result = await deleteNode({ 
        clusterName, 
        nodeName 
      }).unwrap();


      // Success notification
      toast.success(result.message || `Node ${nodeName} successfully removed`);
    } catch (error) {
      // Error handling
      toast.error(
        error.data?.detail || 
        `Failed to delete node: ${error.message}` || 
        'An unexpected error occurred'
      );
    }
  };


  // Render nothing if no nodes
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
            <th className="border p-3 text-left">Roles</th>
            <th className="border p-3 text-left">Actions</th>
            <th className="border p-3 text-left">Delete</th>
          </tr>
        </thead>
        <tbody>
          {clusterDetails.nodes.map((node, index) => (
            <React.Fragment key={index}>
              <tr className="hover:bg-gray-50">
                <td className="border p-3">{node.name}</td>
                <td className="border p-3">{node.roles}</td>
                <td className="border p-3">
                  <button
                    onClick={() => toggleNodeChart(node.name)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {selectedNodeCharts[node.name] ? "Hide Chart" : "Show Chart"}
                  </button>
                </td>
                <td className="border p-3">
                  <button
                    onClick={() => handleNodeDeletion(node.name)}
                    className="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                    title="Delete Node"
                    disabled={isDeleting || node.roles.includes('control-plane')}
                  >
                    {isDeleting ? (
                      <div className="animate-spin">
                        <svg 
                          className="w-5 h-5" 
                          xmlns="http://www.w3.org/2000/svg" 
                          fill="none" 
                          viewBox="0 0 24 24"
                        >
                          <circle 
                            className="opacity-25" 
                            cx="12" 
                            cy="12" 
                            r="10" 
                            stroke="currentColor" 
                            strokeWidth="4"
                          ></circle>
                          <path 
                            className="opacity-75" 
                            fill="currentColor" 
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      </div>
                    ) : (
                      <Trash2 size={20} />
                    )}
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


export default NodeMetricsTable;