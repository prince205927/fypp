import { baseApi } from "../../services/api";


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
      query: ({ clusterName, nodeName }) => ({
        url: "get_cluster_metrics",
        params: { cluster_name: clusterName, node_name: nodeName },
      }),
      providesTags: (result, error, { clusterName, nodeName }) => [
        { type: "ClusterStats", id: `${clusterName}-${nodeName}` },
      ],
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
              // Find and update the specific deployment's replicas
              const imageToUpdate = draft.parsedImages.find(
                img => img.deployment === data.deploymentName
              );

              if (imageToUpdate) {
                imageToUpdate.replicas = data.replicas;
              }
            })
          );

          // Wait for the actual mutation to complete
          await queryFulfilled;
        } catch {
          // If mutation fails, revert the optimistic update
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
          url: 'http://127.0.0.1:8000/upload_deployment',
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
          
          // Optional: Custom headers if needed
          headers: {
            // You can add custom headers here if required
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
        console.group('❌ Image Update Error');
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
