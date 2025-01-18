import React, { useState } from 'react';
import { 
  useGetJenkinsJobsQuery, 
  useGetJobBuildHistoryQuery,
  useTriggerJobMutation,
  useGetJobDetailsQuery,
  useGetConsoleOutputQuery
} from '../features/clusters/clusterApi';
import { 
  Play, 
  FileText, 
  List, 
  Terminal 
} from 'lucide-react';
import { toast } from 'react-toastify';


export function Jenkins() {
  // State management
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedBuild, setSelectedBuild] = useState(null);


  // Query hooks
  const { data: jobs = [], isLoading: jobsLoading } = useGetJenkinsJobsQuery();
  const { 
    data: buildHistory = [], 
    isLoading: buildsLoading 
  } = useGetJobBuildHistoryQuery(selectedJob?.name, {
    skip: !selectedJob
  });
  console.log(buildHistory)

  const { 
    data: jobDetails, 
    isLoading: detailsLoading 
  } = useGetJobDetailsQuery(selectedJob?.name, {
    skip: !selectedJob
  });
  console.log(jobDetails)

  const { 
    data: consoleOutput, 
    isLoading: consoleLoading 
  } = useGetConsoleOutputQuery(
    { 
      jobName: selectedJob?.name, 
      buildNumber: selectedBuild 
    }, 
    { skip: !selectedJob || !selectedBuild }
  );
console.log(consoleOutput)

  // Mutations
  const [triggerJob] = useTriggerJobMutation();


  // Event Handlers
  const handleTriggerJob = async (jobName) => {
    try {
      const response = await triggerJob(jobName).unwrap();
      toast.success(`Job ${jobName} triggered successfully`);
    } catch (error) {
      toast.error(`Failed to trigger job: ${error.message}`);
    }
  };


  // Render Methods
  const renderJobsList = () => (
    <div className="bg-white shadow rounded-lg p-4">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <List className="mr-2" /> Jenkins Jobs
      </h2>
      {jobsLoading ? (
        <p>Loading jobs...</p>
      ) : (
        <ul className="space-y-2">
          {jobs.map((job) => (
            <li 
              key={job.name}
              className={`
                p-2 rounded cursor-pointer 
                ${selectedJob?.name === job.name 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'hover:bg-gray-100'
                }
              `}
              onClick={() => setSelectedJob(job)}
            >
              <div className="flex justify-between items-center">
                <span>{job.name}</span>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTriggerJob(job.name);
                  }}
                  className="bg-green-500 text-white p-1 rounded hover:bg-green-600"
                >
                  <Play size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );


  const renderBuildHistory = () => (
    <div className="bg-white shadow rounded-lg p-4">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <FileText className="mr-2" /> Build History
      </h2>
      {buildsLoading ? (
        <p>Loading build history...</p>
      ) : (
        <ul className="space-y-2">
          {buildHistory.map((build) => (
            <li 
              key={build.number}
              className={`
                p-2 rounded cursor-pointer 
                ${build.result === 'SUCCESS' 
                  ? 'bg-green-50 text-green-800' 
                  : build.result === 'FAILURE'
                  ? 'bg-red-50 text-red-800'
                  : 'bg-gray-50'
                }
                ${selectedBuild === build.number 
                  ? 'ring-2 ring-purple-500' 
                  : 'hover:bg-gray-100'
                }
              `}
              onClick={() => setSelectedBuild(build.number)}
            >
              Build #{build.number} - {build.result}
            </li>
          ))}
        </ul>
      )}
    </div>
  );


  const renderJobDetails = () => (
    <div className="bg-white shadow rounded-lg p-4">
      <h2 className="text-xl font-bold mb-4">Job Details</h2>
      {detailsLoading ? (
        <p>Loading job details...</p>
      ) : (
        <div className="space-y-2">
          <p><strong>Description:</strong> {jobDetails?.description || "No description available."}</p>
          <p><strong>Project URL:</strong> {jobDetails?.projectUrl || "No URL available."}</p>
        </div>
      )}
    </div>
  );




  const renderConsoleOutput = () => (
    <div className="bg-white shadow rounded-lg p-4">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <Terminal className="mr-2" /> Console Output
      </h2>
      {consoleLoading ? (
        <p>Loading console output...</p>
      ) : (
        <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-96">
          {consoleOutput?.consoleText || 'No console output available'}
        </pre>
      )}
    </div>
  );




  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      <div>{renderJobsList()}</div>
      <div>{renderBuildHistory()}</div>
      <div>
        {renderJobDetails()}
        {selectedBuild && renderConsoleOutput()}
      </div>
    </div>
  );
}

export default Jenkins;