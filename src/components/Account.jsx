import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useGetClusterDetailsQuery } from '../features/clusters/clusterApi';


export function Account() {
  const { clusterName } = useParams();
  
  const {
    data: clusterDetails,
    isLoading,
    isError,
    error,
  } = useGetClusterDetailsQuery(clusterName, {
    skip: !clusterName,
    refetchOnMountOrArgChange: true,
  });
  console.log(clusterDetails)

  // Comprehensive logging
  useEffect(() => {
    if (clusterDetails) {
      console.group('🔍 Cluster Details Debug');
      
      // Detailed logging of each section
      console.log('📛 Cluster Name:', clusterDetails.cluster_name);
      
      console.log('🖥️ Nodes:', clusterDetails.nodes);
      console.log('Nodes Count:', clusterDetails.nodes?.length);
      
      console.log('📊 Node Stats:', clusterDetails.node_stats);
      console.log('Node Stats Keys:', Object.keys(clusterDetails.node_stats || {}));
      
      console.log('📦 Pods:', clusterDetails.pods);
      console.log('Pods Count:', clusterDetails.pods?.length);
      
      console.log('📈 Pod Stats:', clusterDetails.pod_stats);
      console.log('Pod Stats Keys:', Object.keys(clusterDetails.pod_stats || {}));
      
      console.log('🚢 Deployments:', clusterDetails.deployments);
      console.log('Deployments Count:', clusterDetails.deployments?.length);
      
      console.log('📝 Overview:', clusterDetails.overview);
      
      console.groupEnd();
    }
  }, [clusterDetails]);


  // Error logging
  useEffect(() => {
    if (isError) {
      console.error('❌ Cluster Details Fetch Error:', error);
    }
  }, [isError, error]);


  // Loading state
  if (isLoading) {
    return <div>Loading Cluster Details...</div>;
  }


  // Error state
  if (isError) {
    return <div>Error: {error.message}</div>;
  }


  // Detailed rendering for debugging
  return (
    <div>
      <h1>Cluster Details Debugger: {clusterName}</h1>
      
      <section>
        <h2>Raw Cluster Details</h2>
        <pre>{JSON.stringify(clusterDetails, null, 2)}</pre>
      </section>
    </div>
  );
}


export default Account;