import { baseApi } from "../../services/api";
import { toast } from 'react-toastify';

export const clusterApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getClusters: builder.query({
      query: () => "/list_clusters",
      transformResponse: (response) => {
        return response.clusters.map((cluster) => ({
          id: cluster.cluster_name,
          name: cluster.cluster_name,
          ip: "",
          port: "",
          status: cluster.nodes > 0 ? "Operational" : "Unavailable",
          cpu: cluster.cpu,
          memory: cluster.memory,
          nodes: cluster.nodes,
          pods: cluster.pods,
          images: cluster.images,
        }));
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ id }) => ({ type: "Clusters", id })),
              { type: "Clusters", id: "LIST" },
            ]
          : [{ type: "Clusters", id: "LIST" }],
    }),
    addCluster: builder.mutation({
query: (clusterData) => ({
url: "add_cluster",
method: "POST",
body: clusterData,
}),
invalidatesTags: ["Clusters"],
}),

  

    getClusterMetrics: builder.query({
      query: ({ clusterName, nodeName, timeRange = 'latest' }) => ({
        url: 'get_cluster_metrics',
        params: {
          cluster_name: clusterName,
          node_name: nodeName,
          time_range: timeRange
        }
      }),
      transformResponse: (response) => {
        // Handle potential error responses
        if (response.error) {
          console.warn(response.error);
          return {
            timestamps: [],
            cpu_metrics: [],
            memory_metrics: []
          };
        }
        return response;
      }
    }),

  getPodMetrics: builder.query({
    query: ({ clusterName, podName, timeRange = 'latest' }) => ({
        url: 'get_pod_metrics', 
        params: { 
            cluster_name: clusterName,
            pod_name: podName,
            time_range: timeRange
        },
    }),
    providesTags: (result, error, { clusterName, podName, timeRange }) => [
        { type: 'PodMetrics', id: `${clusterName}-${podName}-${timeRange}` },
    ],
}),
getClusterServices: builder.query({
  query: ({ clusterName }) => ({
      url: `api/cluster/${clusterName}/services`,
      method: 'GET'
  }),
  providesTags: (result, error, { clusterName }) => [
      { type: 'ClusterServices', id: clusterName }
  ],
}),
  deleteCluster: builder.mutation({
    query: (clusterName) => {
        // Ensure clusterName is a string and not empty
        if (!clusterName || typeof clusterName !== 'string') {
            throw new Error('Invalid cluster name');
        }


        return {
            url: `delete_cluster/${encodeURIComponent(clusterName)}`,
            method: 'POST', // Change from DELETE to POST
            // If your backend expects a specific content type
            headers: {
                'Content-Type': 'application/json',
            },
        }
    },
    invalidatesTags: ['Clusters'],
    
    async onQueryStarted(clusterName, { dispatch, queryFulfilled }) {
        try {
            const response = await queryFulfilled;
            
        
            if (response.data.status === 'success') {
                toast.success(`Cluster '${clusterName}' deleted successfully`);
            } else {
                toast.error('Unexpected response from server');
            }
        } catch (error) {
            console.error('Delete cluster error:', error);
            

            if (error.error) {
                const { status, data } = error.error;
                
                switch (status) {
                    case 404:
                        toast.error(`Cluster '${clusterName}' not found`);
                        break;
                    case 405:
                        toast.error('Method Not Allowed. Please contact support.');
                        break;
                    case 500:
                        toast.error('Internal server error. Please try again later.');
                        break;
                    default:
                        toast.error(data?.detail || 'Failed to delete cluster');
                }
            } else {
                toast.error('An unexpected error occurred');
            }
        }
    }
}),


    getClusterDetails: builder.query({
      query: (clusterName) => ({
        url: `/cluster/${clusterName}`,
        method: 'GET',
      }),
      transformResponse: (response) => {
        const transformedNodes = response.nodes.map(node => ({
          name: node.name,
          status: node.status,
          roles: node.roles,
        }));

        const transformedNodeStats = Object.entries(response.node_stats).reduce((acc, [nodeName, stats]) => {
          acc[nodeName] = stats.map(stat => ({
            timestamp: stat[0],
            cpu: parseFloat(stat[1]),
            memory: parseFloat(stat[2]),
          }));
          return acc;
        }, {});

        const transformedPodStats = Object.entries(response.pod_stats).reduce((acc, [podName, stats]) => {
          acc[podName] = stats.map(stat => ({
            timestamp: stat[0],
            cpu: parseFloat(stat[1]),
            memory: parseFloat(stat[2]),
          }));
          return acc;
        }, {});

        return {
          ...response,
          nodes: transformedNodes,
          node_stats: transformedNodeStats,
          pod_stats: transformedPodStats,
          deployments: response.deployments.map(deployment => ({
            namespace: deployment.namespace,
            name: deployment.name,
            container: deployment.container,
            image: deployment.image,
            replicas: deployment.replicas,
          })),
        };
      },

      providesTags: ['ClusterDetails'],
    }),

    updateReplicas: builder.mutation({
      query: (data) => {
        const formData = new FormData();
        formData.append('cluster_name', data.clusterName);
        formData.append('deployment_name', data.deploymentName);
        formData.append('replicas', data.replicas.toString());

        return {
          url: 'update_replicas',
          method: 'POST',
          body: formData,
        };
      },

      invalidatesTags: (result, error, data) => [
        { type: 'ClusterDetails', id: data.clusterName },
        'Pods',
        'Deployments',
        'ClusterDetails',
      ],

      async onQueryStarted(data, { dispatch, queryFulfilled }) {
        try {
          // Optimistically update the local cache
          const patchResult = dispatch(
            clusterApi.util.updateQueryData('getClusterDetails', data.clusterName, (draft) => {
        
              const imageToUpdate = draft.parsedImages.find(
                img => img.deployment === data.deploymentName
              );

              if (imageToUpdate) {
                imageToUpdate.replicas = data.replicas;
              }
            })
          );

        
          await queryFulfilled;
        } catch {
       
          patchResult.undo();
        }
      }
    }),

    uploadDeployment: builder.mutation({
      query: ({ file, clusterName }) => {
        // Validate inputs
        if (!file) {
          throw new Error('No file selected');
        }

        if (!clusterName) {
          throw new Error('Cluster name is required');
        }

        // Create FormData
        const formData = new FormData();
        formData.append('cluster_name', clusterName);
        formData.append('file', file, file.name);

        return {
          url: 'http://:800127.0.0.10/upload_deployment',
          method: 'POST',
          body: formData,

          // Explicit fetch options
          fetchOptions: {
            timeout: 30000, // 30-second timeout
          }
        };
      },

      // Enhanced error handling
      transformErrorResponse: (error, meta, arg) => {
        console.group('Upload Deployment Error');
        console.error('Full Error Object:', error);
        console.log('Metadata:', meta);
        console.log('Arguments:', arg);

        return {
          message: error.data?.error || 'Network error - Please check your connection',
          details: error.data?.details || error.message,
          fullError: error
        };
      }
    }),

    openTerminal: builder.mutation({
      query: (clusterName) => {
        const formData = new FormData();
        formData.append("cluster_name", clusterName);
        return {
          url: "open_terminal",
          method: "POST",
          body: formData,
          headers: {},
        };
      },
    }),

    updateImage: builder.mutation({
      query: ({ 
        clusterName, 
        deploymentName, 
        containerName, 
        newImage,
        namespace = 'default'
      }) => {
        // Validate inputs
        if (!clusterName || !deploymentName || !containerName || !newImage) {
          throw new Error('Missing required parameters for image update');
        }
    
    
        // Create FormData for multipart/form-data
        const formData = new FormData();
        formData.append('cluster_name', clusterName);
        formData.append('deployment', deploymentName);
        formData.append('container', containerName);
        formData.append('newImage', newImage);
        formData.append('namespace', namespace);
    
    
        return {
          url: 'http://127.0.0.1:8000/update_image',
          method: 'POST',
          body: formData,
          
    
          headers: {
           
          },
    
    
          // Explicit fetch options
          fetchOptions: {
            timeout: 30000, // 30-second timeout
          }
        };
      },
    
    
      // Enhanced response transformation
      transformResponse: (response, meta, arg) => {
        // Comprehensive logging
        console.group('🚀 Image Update Success');
        console.log('Full Response:', response);
        console.log('Update Details:', {
          clusterName: arg.clusterName,
          deploymentName: arg.deploymentName,
          containerName: arg.containerName,
          newImage: arg.newImage,
          timestamp: new Date().toISOString()
        });
        console.groupEnd();
    
    
        // Structured response
        return {
          success: true,
          message: response?.message || 'Image updated successfully',
          details: {
            clusterName: arg.clusterName,
            deploymentName: arg.deploymentName,
            containerName: arg.containerName,
            newImage: arg.newImage,
            updatedAt: new Date().toISOString()
          },
          rawResponse: response
        };
      },
    
    
      // Enhanced error transformation
      transformErrorResponse: (response, meta, arg) => {
        // Comprehensive error logging
        console.group(' Image Update Error');
        console.error('Error Response:', response);
        console.log('Error Metadata:', meta);
        console.log('Error Arguments:', arg);
        console.log('Timestamp:', new Date().toISOString());
        console.groupEnd();
    
    
        // Structured error response
        return {
          error: true,
          statusCode: response.status,
          message: response.data?.detail || 'Failed to update image',
          details: {
            clusterName: arg.clusterName,
            deploymentName: arg.deploymentName,
            containerName: arg.containerName,
            newImage: arg.newImage,
            failedAt: new Date().toISOString()
          },
          rawError: response
        };
      },
    
    
      // Invalidate and refetch related data
      invalidatesTags: (result, error, arg) => [
        { type: 'Deployments', id: arg.clusterName },
        { type: 'ClusterDetails', id: arg.clusterName },
        'Pods'
      ],
    
    
      // Optimistic update mechanism
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          // Optimistically update the local cache
          const patchResult = dispatch(
            clusterApi.util.updateQueryData('getClusterDetails', arg.clusterName, (draft) => {
              // Find and update the specific deployment's image
              const deploymentToUpdate = draft.deployments.find(
                dep => dep.name === arg.deploymentName && 
                       dep.namespace === (arg.namespace || 'default')
              );
    
    
              if (deploymentToUpdate) {
                deploymentToUpdate.image = arg.newImage;
              }
            })
          );
    
    
          // Wait for the actual mutation to complete
          await queryFulfilled;
        } catch (error) {
          // If mutation fails, revert the optimistic update
          patchResult.undo();
    
    
          // Log the error
          console.error('Optimistic update failed', error);
        }
      }
    }),

   

    updateClusterInterval: builder.mutation({
      query: ({ clusterName, interval }) => ({
        url: 'set_interval',
        method: 'POST',
        params: { cluster_name: clusterName, interval },
      }),
      invalidatesTags: (result, error, { clusterName }) => [
        { type: 'Clusters', id: clusterName },
      ],
    }),
  }),
});

export const {
  useDeleteClusterMutation,
  useGetClusterServicesQuery,
  useUpdateImageMutation,
  useUpdateReplicasMutation,
  useGetDeploymentsDataQuery,
  useUploadDeploymentMutation,
  useGetClusterMetricsQuery,
  useGetClustersQuery,
  useGetClusterDetailsQuery,
  useGetNodeMetricsQuery,
  useGetPodMetricsQuery,
  useAddClusterMutation,
  useOpenTerminalMutation,
  useUpdateClusterIntervalMutation,
  useGetJenkinsJobsQuery,
  useGetJobBuildHistoryQuery,
  useGetBuildReportQuery,
  useTriggerJobMutation,
  useGetJobDetailsQuery,
  useGetConsoleOutputQuery,
} = clusterApi;
