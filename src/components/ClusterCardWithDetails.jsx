import { useGetClusterDetailsQuery } from "../features/clusters/clusterApi";
import { SystemCard } from "./MonitoringDashboard";
import { toast } from 'react-toastify';
const ClusterCardWithDetails = ({ cluster, onDelete, darkMode, navigate }) => {
    const { data: details, isLoading: isDetailsLoading } = useGetClusterDetailsQuery(
        cluster.id,
        { 
          skip: !cluster.id,
          // Refetch every 30 seconds
          pollingInterval: 30000,
          // Refetch when the component mounts
          refetchOnMountOrArgChange: true
        }
      );
  
    return (
      <SystemCard
        {...cluster}
        details={details}
        isLoading={isDetailsLoading}
        onDelete={onDelete}
        darkMode={darkMode}
        navigate={navigate}
      />
    );
  };

  export default ClusterCardWithDetails;