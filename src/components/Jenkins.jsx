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
  ArrowLeft,
  X
} from 'lucide-react';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { Dialog } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';

const Modal = ({ isOpen, onClose, children, title}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
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
   const [jobInfo, setJobInfo] = useState(null);
   const [consoleOutput, setConsoleOutput] = useState('');
   const [jobDetails, setJobDetails] = useState(null);
   const [isConsoleModalOpen, setIsConsoleModalOpen] = useState(false);
   const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
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
  const navigate = useNavigate();
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

// Add a new function to fetch job config details
const fetchJobConfigDetails = async (jobName) => {
  try {
    setLoading(prev => ({ ...prev, details: true }));
    const response = await fetch(
      `${baseUrl}/job/${jobName}/config.xml`,
      { 
        headers: {
          ...getHeaders(),
          'Accept': 'application/xml'
        }
      }
    );


    if (!response.ok) throw new Error(`Failed to fetch job config: ${response.status}`);
    
    const xmlText = await response.text();
    
    // Parse XML using DOMParser
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
    
    // Extract details
    const description = xmlDoc.querySelector('description')?.textContent || 'No description';
    
    // Extract project URL
    const projectUrlNode = xmlDoc.querySelector('com\\.coravy\\.hudson\\.plugins\\.github\\.GithubProjectProperty > projectUrl');
    const projectUrl = projectUrlNode?.textContent || 'No URL';
    
    // Extract pipeline script
    const scriptNode = xmlDoc.querySelector('definition > script');
    const script = scriptNode?.textContent || 'No pipeline script';
    
    // Additional details extraction
    const scmNode = xmlDoc.querySelector('scm[class*="GitSCM"]');
    const repositories = scmNode 
      ? Array.from(scmNode.querySelectorAll('userRemoteConfig > url'))
        .map(url => url.textContent)
      : [];


    const jobDetails = {
      description,
      projectUrl,
      script,
      repositories
    };


    setJobInfo(jobDetails);
    setIsInfoModalOpen(true);
  } catch (err) {
    setError(prev => ({ ...prev, details: err.message }));
    console.error('Job config fetch error:', err);
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

      // if (!response.ok) throw new Error(`Failed to fetch console output: ${response.status}`);
      if (!response.ok) throw new Error(`Select a build from build history`);

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
    // Additional method to open console output modal
    const openConsoleModal = async (jobName, buildNumber) => {
      setSelectedBuild(buildNumber);
      await fetchConsoleOutput(jobName, buildNumber);
      setIsConsoleModalOpen(true);
    };

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
      
      <Card 
        key={job.name} 
        className={`hover:shadow-lg transition-shadow ${
          selectedJob?.name === job.name ? 'border-purple-500 border-2' : ''
        }`}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{job.name}</h2>
            <span className={`px-2 py-1 rounded-full text-sm ${
              job.color === 'blue' ? 'bg-green-100 text-green-800' :
              job.color === 'red' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              
            </span>
          </div>
        </CardHeader>
        
        <CardContent>
          <p className="text-gray-600 mb-4 line-clamp-2">
            {job.description || 'No description'}
          </p>
          
          <div className="flex gap-16">
            <button 
              onClick={() => setSelectedJob(job)}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
            >
              <Eye size={16} />
              <span>View Details</span>
            </button>
            
            <button
              onClick={() => triggerJob(job.name)}
              className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <Play size={16} />
              <span>Build Now</span>
            </button>
            
            <button
               onClick={() => {
                setSelectedJob(job);
                fetchJobConfigDetails(job.name);
              }}
              className="flex items-center space-x-1 px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
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
        <div className="grid grid-cols-[500px_1fr] gap-4">
          {/* Left Column: Jobs */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Jenkins Jobs</h1>
              <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-full  hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
              <button 
                onClick={fetchJobs}
                className="px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                <RefreshCw size={16} />
              </button>
            </div>
  
  
            {loading.jobs ? (
              <div className="flex justify-center">
                <Loader2 className="animate-spin" />
              </div>
            ) : error.jobs ? (
              renderErrorState(error.jobs, fetchJobs)
            ) : (
              <div className="space-y-4">
                {jobs.map(renderJobCard)}
              </div>
            )}
          </div>
  
  
          {/* Right Column: Job Details */}
          <div>
            {selectedJob ? (
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-bold">
                    {selectedJob.name} Details
                  </h2>
                </CardHeader>
                <CardContent>
                  {/* Build History */}
                  <div>
                    <h3 className="font-semibold mb-2">Build History</h3>
                    {loading.builds ? (
                      <div className="flex justify-center">
                        <Loader2 className="animate-spin" />
                      </div>
                    ) : error.builds ? (
                      renderErrorState(error.builds, () => fetchBuildHistory(selectedJob.name))
                    )
                    : (
                      <div className="space-y-2">
                        {buildHistory.map((build) => (
                          <div
                            key={build.number}
                            onClick={() => openConsoleModal(selectedJob.name, build.number)}
                            className={`p-2 rounded cursor-pointer ${
                              selectedBuild === build.number
                                ? 'bg-purple-100 border border-purple-300'
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
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center text-gray-500">
                Select a job to view details
              </div>
            )}
          </div>
        </div>
  
  
        {/* Console Output Modal */}
        <Modal 
          isOpen={isConsoleModalOpen} 
          onClose={() => setIsConsoleModalOpen(false)} 
          title={`Console Output - Build #${selectedBuild}`}
        >
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-[500px] text-sm">
            {consoleOutput || 'No console output available'}
          </pre>
        </Modal>
        <Modal 
  isOpen={isInfoModalOpen} 
  onClose={() => setIsInfoModalOpen(false)} 
  title={`Job Configuration: ${selectedJob?.name || ''}`}
>
  {loading.details ? (
    <div className="flex justify-center items-center">
      <Loader2 className="animate-spin" />
    </div>
  ) : error.details ? (
    <div className="text-red-500">{error.details}</div>
  ) : jobInfo ? (
    <div className="space-y-4">
      <div>
        <h3 className="font-semibold">Description</h3>
        <p className="text-gray-600">{jobInfo.description}</p>
      </div>


      {jobInfo.projectUrl && (
        <div>
          <h3 className="font-semibold">Project URL</h3>
          <a 
            href={jobInfo.projectUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline break-all"
          >
            {jobInfo.projectUrl}
          </a>
        </div>
      )}


      {jobInfo.repositories && jobInfo.repositories.length > 0 && (
        <div>
          <h3 className="font-semibold">Repositories</h3>
          <ul className="list-disc pl-5 space-y-1">
            {jobInfo.repositories.map((repo, index) => (
              <li key={index} className="break-all">
                <a 
                  href={repo} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {repo}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}


      {jobInfo.script && (
        <div>
          <h3 className="font-semibold">Pipeline Script</h3>
          <pre className="bg-gray-100 p-3 rounded-md overflow-auto max-h-48 text-sm">
            {jobInfo.script}
          </pre>
        </div>
      )}
    </div>
  ) : null}
</Modal>


  
      </div>
    );
  }
 
  
  export default Jenkins;