import React, { useMemo } from 'react';
import { useGetClusterServicesQuery } from '../features/clusters/clusterApi'; 


export const ServicesComponent = ({ clusterName }) => {
  const { 
    data: servicesData, 
    isLoading, 
    error 
  } = useGetClusterServicesQuery({ clusterName }, {
    // Skip query if no cluster name
    skip: !clusterName
  });


  // Memoize processed services
  const processedServices = useMemo(() => {
    if (!servicesData?.services) return [];


    return servicesData.services.map(service => ({
      ...service,
      serviceLink: 
        (service.type !== 'ClusterIP' && service.ports) 
          ? `http://${servicesData.cluster_ip}:${service.ports}` 
          : null
    }));
  }, [servicesData]);


  // Render loading state
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-blue-500 mr-4"></div>
          <span>Loading Services...</span>
        </div>
      </div>
    );
  }


  // Render error state
  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="text-red-500">
          Error loading services: {error.message}
        </div>
      </div>
    );
  }


  // Render empty state
  if (!processedServices.length) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="text-center text-gray-500">
          No services found for this cluster
        </div>
      </div>
    );
  }


  // Render services table
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold mb-4 flex items-center">
        Cluster Services
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="border p-3 text-left">Name</th>
              <th className="border p-3 text-left">Type</th>
              <th className="border p-3 text-left">Cluster IP</th>
              <th className="border p-3 text-left">Ports</th>
              <th className="border p-3 text-left">Service Link</th>
            </tr>
          </thead>
          <tbody>
            {processedServices.map((service, index) => (
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
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Access Service
                    </a>
                  ) : (
                    'N/A'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};