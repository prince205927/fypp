import React, { useState, useCallback, useEffect } from 'react';
import { 
  Play, 
  FileText, 
  List, 
  Terminal,
  Info,
  Eye,
  RefreshCw,
  AlertTriangle,
  Loader2,
  X
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { Dialog } from '@headlessui/react';

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
        {children}
      </div>
    </div>
  );
};

export function Jenkins() {
  // State Management
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedBuild, setSelectedBuild] = useState(null);
  const [buildHistory, setBuildHistory] = useState([]);
  const [consoleOutput, setConsoleOutput] = useState('');
  const [jobDetails, setJobDetails] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [loading, setLoading] = useState({
    jobs: false,
    builds: false,
    console: false,
    details: false
  });
  const [error, setError] = useState({
    jobs: null,
    builds: null,
    console: null,
    details: null
  });

  // API Configuration
  const baseUrl = 'http://10.200.16.17:8080';
  
  const getHeaders = () => {
    const username = 'jenkins';
    const token = '113c0729b83dabd474a7d4a5a5849a4188';
    const base64Credentials = btoa(`${username}:${token}`);
    
    return {
      'Authorization': `Basic ${base64Credentials}`,
      'Accept': 'application/json'
    };
  };

  // API Calls
  const fetchJobs = async () => {
    try {
      setLoading(prev => ({ ...prev, jobs: true }));
      const response = await fetch(
        `${baseUrl}/api/json?tree=jobs[name,url,color,description,lastBuild[number,timestamp,result]]`,
        { headers: getHeaders() }
      );

      if (!response.ok) throw new Error(`API request failed with status: ${response.status}`);
      
      const data = await response.json();
      setJobs(data.jobs);
      setError(prev => ({ ...prev, jobs: null }));
    } catch (err) {
      setError(prev => ({ ...prev, jobs: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, jobs: false }));
    }
  };

  const getJobDetails = async (jobName) => {
    try {
      setLoading(prev => ({ ...prev, details: true }));
      const response = await fetch(
        `${baseUrl}/job/${jobName}/api/json`,
        { headers: getHeaders() }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch job details');
      }
      
      const data = await response.json();
      setJobDetails(data);
      setIsModalOpen(true);
    } catch (error) {
      setError(prev => ({ ...prev, details: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, details: false }));
    }
  };

  const fetchBuildHistory = async (jobName) => {
    if (!jobName) return;
    
    try {
      setLoading(prev => ({ ...prev, builds: true }));
      const response = await fetch(
        `${baseUrl}/job/${jobName}/api/json?tree=builds[number,url,result,timestamp,duration]`,
        { headers: getHeaders() }
      );

      if (!response.ok) throw new Error(`Failed to fetch build history: ${response.status}`);
      
      const data = await response.json();
      setBuildHistory(data.builds || []);
      setError(prev => ({ ...prev, builds: null }));
    } catch (err) {
      setError(prev => ({ ...prev, builds: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, builds: false }));
    }
  };

  const fetchConsoleOutput = async (jobName, buildNumber) => {
    if (!jobName || !buildNumber) return;
    
    try {
      setLoading(prev => ({ ...prev, console: true }));
      const response = await fetch(
        `${baseUrl}/job/${jobName}/${buildNumber}/consoleText`,
        { headers: getHeaders() }
      );

      if (!response.ok) throw new Error(`Failed to fetch console output: ${response.status}`);
      
      const text = await response.text();
      setConsoleOutput(text);
      setError(prev => ({ ...prev, console: null }));
    } catch (err) {
      setError(prev => ({ ...prev, console: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, console: false }));
    }
  };

  const fetchJobDetails = async (jobName) => {
    if (!jobName) return;
    
    try {
      setLoading(prev => ({ ...prev, details: true }));
      const response = await fetch(
        `${baseUrl}/job/${jobName}/api/json`,
        { headers: getHeaders() }
      );

      if (!response.ok) throw new Error(`Failed to fetch job details: ${response.status}`);
      
      const data = await response.json();
      setJobDetails(data);
      setError(prev => ({ ...prev, details: null }));
    } catch (err) {
      setError(prev => ({ ...prev, details: err.message }));
    } finally {
      setLoading(prev => ({ ...prev, details: false }));
    }
  };

  const triggerJob = async (jobName) => {
    try {
      const response = await fetch(
        `${baseUrl}/job/${jobName}/build`,
        { 
          method: 'POST',
          headers: getHeaders()
        }
      );

      if (!response.ok) throw new Error(`Failed to trigger job: ${response.status}`);
      
      // Refetch data after triggering
      await fetchJobs();
      if (selectedJob?.name === jobName) {
        await fetchBuildHistory(jobName);
      }
    } catch (err) {
      setError(prev => ({ ...prev, jobs: err.message }));
    }
  };

  // Effects
  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (selectedJob) {
      fetchBuildHistory(selectedJob.name);
      fetchJobDetails(selectedJob.name);
    }
  }, [selectedJob]);

  useEffect(() => {
    if (selectedJob?.name && selectedBuild) {
      fetchConsoleOutput(selectedJob.name, selectedBuild);
    }
  }, [selectedJob, selectedBuild]);

  // Utility Functions
  const getStatusColor = useCallback((color) => {
    if (color === 'blue' || color === 'blue_anime') return 'bg-green-100 text-green-800';
    if (color === 'red' || color === 'red_anime') return 'bg-red-100 text-red-800';
    if (color === 'yellow' || color === 'yellow_anime') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  }, []);

  const getStatusText = useCallback((color) => {
    if (color?.includes('_anime')) return 'In Progress';
    if (color === 'blue') return 'Success';
    if (color === 'red') return 'Failed';
    if (color === 'yellow') return 'Unstable';
    if (color === 'disabled') return 'Disabled';
    return 'N/A';
  }, []);

  // Render Methods
  const renderErrorState = (error, retryFn) => (
    <div className="bg-red-50 border border-red-200 rounded p-4 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <AlertTriangle className="text-red-500" />
        <p className="text-red-700">{error}</p>
      </div>
      <button 
        onClick={retryFn}
        className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 flex items-center"
      >
        <RefreshCw className="mr-2" size={16} />
        Retry
      </button>
    </div>
  );

  const renderJobCard = (job) => (
    <Card key={job.name} className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{job.name}</h2>
          <span className={`px-2 py-1 rounded-full text-sm ${
            job.color === 'blue' ? 'bg-green-100 text-green-800' :
            job.color === 'red' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {job.color === 'blue' ? 'Success' : 
             job.color === 'red' ? 'Failed' : 
             'Unknown'}
          </span>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-gray-600 mb-4 line-clamp-2">
          {job.description || 'No description'}
        </p>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => setSelectedJob(selectedJob?.name === job.name ? null : job)}
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
          >
            <Eye size={16} />
            <span>{selectedJob?.name === job.name ? 'Hide Details' : 'View Details'}</span>
          </button>
          
          <button
            onClick={() => triggerJob(job.name)}
            className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          >
            <Play size={16} />
            <span>Build Now</span>
          </button>
          
          <button
            onClick={() => getJobDetails(job.name)}
            className="flex items-center space-x-1 px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            <Info size={16} />
            <span>Info</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Jenkins Jobs Dashboard</h1>
        <button 
          onClick={fetchJobs}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center space-x-2"
        >
          <RefreshCw size={16} />
          <span>Refresh</span>
        </button>
      </div>

      {loading.jobs ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      ) : error.jobs ? (
        renderErrorState(error.jobs, fetchJobs)
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map(renderJobCard)}
        </div>
      )}

      {selectedJob && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Build History */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold flex items-center">
                <FileText className="mr-2" /> Build History
              </h2>
            </CardHeader>
            <CardContent>
              {loading.builds ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="animate-spin" />
                </div>
              ) : error.builds ? (
                renderErrorState(error.builds, () => fetchBuildHistory(selectedJob.name))
              ) : (
                <div className="space-y-2">
                  {buildHistory.map((build) => (
                    <div
                      key={build.number}
                      onClick={() => setSelectedBuild(build.number)}
                      className={`p-2 rounded cursor-pointer ${
                        selectedBuild === build.number
                          ? 'bg-purple-100 border-purple-300'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>Build #{build.number}</span>
                        <span className={getStatusColor(build.result)}>
                          {build.result || 'In Progress'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Console Output */}
          {selectedBuild && (
            <Card>
              <CardHeader>
                <h2 className="text-xl font-bold flex items-center">
                  <Terminal className="mr-2" /> Console Output
                </h2>
              </CardHeader>
              <CardContent>
                {loading.console ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="animate-spin" />
                  </div>
                ) : error.console ? (
                  renderErrorState(error.console, () => 
                    fetchConsoleOutput(selectedJob.name, selectedBuild)
                  )
                ) : (
                  <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-sm">
                    {consoleOutput || 'No console output available'}
                  </pre>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Job Details Modal */}
      <Dialog
        open={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        className="fixed inset-0 z-50 overflow-y-auto"
      >
        <div className="flex items-center justify-center min-h-screen">
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
          
          <div className="relative bg-white rounded-lg max-w-2xl mx-auto p-6">
            {loading.details ? (
              <div className="flex justify-center p-4">
                <Loader2 className="animate-spin" />
              </div>
            ) : error.details ? (
              renderErrorState(error.details, () => fetchJobDetails(selectedJob.name))
            ) : (
              <>
                <Dialog.Title className="text-lg font-medium mb-4">
                  Job Details: {selectedJob?.name}
                </Dialog.Title>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium">Description</h3>
                    <p className="text-gray-600">
                      {jobDetails?.description || 'No description available'}
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium">URL</h3>
                    <a 
                      href={jobDetails?.url} 
                      className="text-blue-600 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {jobDetails?.url}
                    </a>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Close
                  </button>
                </div>
                </>
            )}
          </div>
        </div>
      </Dialog>
      
    </div>
    
  );
}

export default Jenkins;