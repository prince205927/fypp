// // import React, { useState } from 'react';
// // import { 
// //   useGetJenkinsJobsQuery, 
// //   useGetJobBuildHistoryQuery,
// //   useTriggerJobMutation,
// //   useGetJobDetailsQuery,
// //   useGetConsoleOutputQuery
// // } from '../features/clusters/clusterApi';
// // import { 
// //   Play, 
// //   FileText, 
// //   List, 
// //   Terminal 
// // } from 'lucide-react';
// // import { toast } from 'react-toastify';


// // export function Jenkins() {
// //   // State management
// //   const [selectedJob, setSelectedJob] = useState(null);
// //   const [selectedBuild, setSelectedBuild] = useState(null);


// //   // Query hooks
// //   const { data: jobs = [], isLoading: jobsLoading } = useGetJenkinsJobsQuery();
// //   const { 
// //     data: buildHistory = [], 
// //     isLoading: buildsLoading 
// //   } = useGetJobBuildHistoryQuery(selectedJob?.name, {
// //     skip: !selectedJob
// //   });
// //   console.log(buildHistory)

// //   const { 
// //     data: jobDetails, 
// //     isLoading: detailsLoading 
// //   } = useGetJobDetailsQuery(selectedJob?.name, {
// //     skip: !selectedJob
// //   });
// //   console.log(jobDetails)

// //   const { 
// //     data: consoleOutput, 
// //     isLoading: consoleLoading 
// //   } = useGetConsoleOutputQuery(
// //     { 
// //       jobName: selectedJob?.name, 
// //       buildNumber: selectedBuild 
// //     }, 
// //     { skip: !selectedJob || !selectedBuild }
// //   );
// // console.log(consoleOutput)

// //   // Mutations
// //   const [triggerJob] = useTriggerJobMutation();


// //   // Event Handlers
// //   const handleTriggerJob = async (jobName) => {
// //     try {
// //       const response = await triggerJob(jobName).unwrap();
// //       toast.success(`Job ${jobName} triggered successfully`);
// //     } catch (error) {
// //       toast.error(`Failed to trigger job: ${error.message}`);
// //     }
// //   };


// //   // Render Methods
// //   const renderJobsList = () => (
// //     <div className="bg-white shadow rounded-lg p-4">
// //       <h2 className="text-xl font-bold mb-4 flex items-center">
// //         <List className="mr-2" /> Jenkins Jobs
// //       </h2>
// //       {jobsLoading ? (
// //         <p>Loading jobs...</p>
// //       ) : (
// //         <ul className="space-y-2">
// //           {jobs.map((job) => (
// //             <li 
// //               key={job.name}
// //               className={`
// //                 p-2 rounded cursor-pointer 
// //                 ${selectedJob?.name === job.name 
// //                   ? 'bg-purple-100 text-purple-800' 
// //                   : 'hover:bg-gray-100'
// //                 }
// //               `}
// //               onClick={() => setSelectedJob(job)}
// //             >
// //               <div className="flex justify-between items-center">
// //                 <span>{job.name}</span>
// //                 <button 
// //                   onClick={(e) => {
// //                     e.stopPropagation();
// //                     handleTriggerJob(job.name);
// //                   }}
// //                   className="bg-green-500 text-white p-1 rounded hover:bg-green-600"
// //                 >
// //                   <Play size={16} />
// //                 </button>
// //               </div>
// //             </li>
// //           ))}
// //         </ul>
// //       )}
// //     </div>
// //   );


// //   const renderBuildHistory = () => (
// //     <div className="bg-white shadow rounded-lg p-4">
// //       <h2 className="text-xl font-bold mb-4 flex items-center">
// //         <FileText className="mr-2" /> Build History
// //       </h2>
// //       {buildsLoading ? (
// //         <p>Loading build history...</p>
// //       ) : (
// //         <ul className="space-y-2">
// //           {buildHistory.map((build) => (
// //             <li 
// //               key={build.number}
// //               className={`
// //                 p-2 rounded cursor-pointer 
// //                 ${build.result === 'SUCCESS' 
// //                   ? 'bg-green-50 text-green-800' 
// //                   : build.result === 'FAILURE'
// //                   ? 'bg-red-50 text-red-800'
// //                   : 'bg-gray-50'
// //                 }
// //                 ${selectedBuild === build.number 
// //                   ? 'ring-2 ring-purple-500' 
// //                   : 'hover:bg-gray-100'
// //                 }
// //               `}
// //               onClick={() => setSelectedBuild(build.number)}
// //             >
// //               Build #{build.number} - {build.result}
// //             </li>
// //           ))}
// //         </ul>
// //       )}
// //     </div>
// //   );


// //   const renderJobDetails = () => (
// //     <div className="bg-white shadow rounded-lg p-4">
// //       <h2 className="text-xl font-bold mb-4">Job Details</h2>
// //       {detailsLoading ? (
// //         <p>Loading job details...</p>
// //       ) : (
// //         <div className="space-y-2">
// //           <p><strong>Description:</strong> {jobDetails?.description || "No description available."}</p>
// //           <p><strong>Project URL:</strong> {jobDetails?.projectUrl || "No URL available."}</p>
// //         </div>
// //       )}
// //     </div>
// //   );




// //   const renderConsoleOutput = () => (
// //     <div className="bg-white shadow rounded-lg p-4">
// //       <h2 className="text-xl font-bold mb-4 flex items-center">
// //         <Terminal className="mr-2" /> Console Output
// //       </h2>
// //       {consoleLoading ? (
// //         <p>Loading console output...</p>
// //       ) : (
// //         <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-96">
// //           {consoleOutput?.consoleText || 'No console output available'}
// //         </pre>
// //       )}
// //     </div>
// //   );




// //   return (
// //     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
// //       <div>{renderJobsList()}</div>
// //       <div>{renderBuildHistory()}</div>
// //       <div>
// //         {renderJobDetails()}
// //         {selectedBuild && renderConsoleOutput()}
// //       </div>
// //     </div>
// //   );
// // }

// // export default Jenkins;


// import React, { useState } from 'react';
// import { 
//   useGetJenkinsJobsQuery, 
//   useGetJobBuildHistoryQuery,
//   useTriggerJobMutation,
//   useGetJobDetailsQuery,
//   useGetConsoleOutputQuery
// } from '../features/clusters/clusterApi';
// import { 
//   Play, 
//   FileText, 
//   List, 
//   Terminal,
//   Info,
//   Server,
//   Eye 
// } from 'lucide-react';
// import { toast } from 'react-toastify';
// import { Dialog } from '@headlessui/react';


// export function Jenkins() {
//   // State management
//   const [selectedJob, setSelectedJob] = useState(null);
//   const [selectedBuild, setSelectedBuild] = useState(null);
//   const [activeView, setActiveView] = useState(null);
//   const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);


//   // Query hooks
//   const { data: jobs = [], isLoading: jobsLoading } = useGetJenkinsJobsQuery();
//   const { 
//     data: buildHistory = [], 
//     isLoading: buildsLoading 
//   } = useGetJobBuildHistoryQuery(selectedJob?.name, {
//     skip: !selectedJob || activeView !== 'builds'
//   });


//   const { 
//     data: jobDetails, 
//     isLoading: detailsLoading 
//   } = useGetJobDetailsQuery(selectedJob?.name, {
//     skip: !selectedJob
//   });


//   const { 
//     data: consoleOutput, 
//     isLoading: consoleLoading 
//   } = useGetConsoleOutputQuery(
//     { 
//       jobName: selectedJob?.name, 
//       buildNumber: selectedBuild 
//     }, 
//     { skip: !selectedJob || !selectedBuild }
//   );


//   // Mutations
//   const [triggerJob] = useTriggerJobMutation();


//   // Event Handlers
//   const handleTriggerJob = async (jobName) => {
//     try {
//       const response = await triggerJob(jobName).unwrap();
//       toast.success(`Job ${jobName} triggered successfully`);
//     } catch (error) {
//       toast.error(`Failed to trigger job: ${error.message}`);
//     }
//   };


//   // Render Methods
//   const renderJobsList = () => (
//     <div className="bg-white shadow rounded-lg p-4">
//       <h2 className="text-xl font-bold mb-4 flex items-center">
//         <List className="mr-2" /> Jenkins Jobs
//       </h2>
//       {jobsLoading ? (
//         <p>Loading jobs...</p>
//       ) : (
//         <ul className="space-y-2">
//           {jobs.map((job) => (
//             <li 
//               key={job.name}
//               className={`
//                 p-2 rounded 
//                 ${selectedJob?.name === job.name 
//                   ? 'bg-purple-100 text-purple-800' 
//                   : 'hover:bg-gray-100'
//                 }
//               `}
//             >
//               <div className="flex justify-between items-center">
//                 <span>{job.name}</span>
//                 <div className="flex space-x-2">
//                   {/* View Build History */}
//                   <button 
//                     onClick={() => {
//                       setSelectedJob(job);
//                       setActiveView('builds');
//                     }}
//                     className="bg-blue-500 text-white p-1 rounded hover:bg-blue-600"
//                     title="View Build History"
//                   >
//                     <Eye size={16} />
//                   </button>


//                   {/* Remote Execute */}
//                   <button 
//                     onClick={() => handleTriggerJob(job.name)}
//                     className="bg-green-500 text-white p-1 rounded hover:bg-green-600"
//                     title="Remote Execute"
//                   >
//                     <Play size={16} />
//                   </button>


//                   {/* Job Details */}
//                   <button 
//                     onClick={() => {
//                       setSelectedJob(job);
//                       setIsDetailsModalOpen(true);
//                     }}
//                     className="bg-gray-500 text-white p-1 rounded hover:bg-gray-600"
//                     title="Job Details"
//                   >
//                     <Info size={16} />
//                   </button>
//                 </div>
//               </div>
//             </li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );


//   const renderBuildHistory = () => {
//     if (activeView !== 'builds') return null;


//     return (
//       <div className="bg-white shadow rounded-lg p-4">
//         <h2 className="text-xl font-bold mb-4 flex items-center">
//           <FileText className="mr-2" /> Build History for {selectedJob.name}
//         </h2>
//         {buildsLoading ? (
//           <p>Loading build history...</p>
//         ) : (
//           <ul className="space-y-2">
//             {buildHistory.map((build) => (
//               <li 
//                 key={build.number}
//                 className={`
//                   p-2 rounded cursor-pointer 
//                   ${build.result === 'SUCCESS' 
//                     ? 'bg-green-50 text-green-800' 
//                     : build.result === 'FAILURE'
//                     ? 'bg-red-50 text-red-800'
//                     : 'bg-gray-50'
//                   }
//                   ${selectedBuild === build.number 
//                     ? 'ring-2 ring-purple-500' 
//                     : 'hover:bg-gray-100'
//                   }
//                 `}
//                 onClick={() => setSelectedBuild(build.number)}
//               >
//                 Build #{build.number} - {build.result}
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>
//     );
//   };


//   const renderConsoleOutput = () => {
//     if (!selectedBuild) return null;


//     return (
//       <div className="bg-white shadow rounded-lg p-4">
//         <h2 className="text-xl font-bold mb-4 flex items-center">
//           <Terminal className="mr-2" /> Console Output for Build #{selectedBuild}
//         </h2>
//         {consoleLoading ? (
//           <p>Loading console output...</p>
//         ) : (
//           <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-96">
//             {consoleOutput || 'No console output available'}
//           </pre>
//         )}
//       </div>
//     );
//   };


//   const renderJobDetailsModal = () => (
//     <Dialog 
//       open={isDetailsModalOpen} 
//       onClose={() => setIsDetailsModalOpen(false)}
//       className="fixed inset-0 z-10 overflow-y-auto"
//     >
//       <div className="flex min-h-screen items-center justify-center">
//         <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
        
//         <div className="relative bg-white rounded max-w-md mx-auto p-6 shadow-xl">
//           <Dialog.Title className="text-xl font-bold mb-4">
//             Job Details: {selectedJob?.name}
//           </Dialog.Title>
          
//           {detailsLoading ? (
//             <p>Loading job details...</p>
//           ) : (
//             <div className="space-y-4">
//               <div>
//                 <strong>Description:</strong>
//                 <p>{jobDetails?.description || "No description available."}</p>
//               </div>
              
//               <div>
//                 <strong>Project URL:</strong>
//                 <p>
//                   {jobDetails?.gitRepository ? (
//                     <a 
//                       href={jobDetails.gitRepository} 
//                       target="_blank" 
//                       rel="noopener noreferrer"
//                       className="text-blue-600 hover:underline"
//                     >
//                       {jobDetails.gitRepository}
//                     </a>
//                   ) : (
//                     "No URL available."
//                   )}
//                 </p>
//               </div>


//               <div>
//                 <strong>Pipeline Script:</strong>
//                 <pre className="bg-gray-100 p-2 rounded overflow-auto">
//                   {jobDetails?.pipelineScript || "No pipeline script available."}
//                 </pre>
//               </div>
//             </div>
//           )}


//           <button 
//             onClick={() => setIsDetailsModalOpen(false)} 
//             className="mt-4 bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
//           >
//             Close
//           </button>
//         </div>
//       </div>
//     </Dialog>
//   );




//   return (
//     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
//       <div>{renderJobsList()}</div>
//       <div>{renderBuildHistory()}</div>
//       <div>
//         {renderConsoleOutput()}
//         {renderJobDetailsModal()}
//       </div>
//     </div>
//   );
// }


// export default Jenkins;

// import React, { useState } from 'react';
// import { 
//   useGetJenkinsJobsQuery, 
//   useGetJobBuildHistoryQuery,
//   useTriggerJobMutation,
//   useGetJobDetailsQuery,
//   useGetConsoleOutputQuery
// } from '../features/clusters/clusterApi';
// import { 
//   Play, 
//   FileText, 
//   List, 
//   Terminal,
//   Info,
//   Eye 
// } from 'lucide-react';
// import { toast } from 'react-toastify';
// import { Dialog } from '@headlessui/react';


// export function Jenkins() {
//   // State management
//   const [selectedJob, setSelectedJob] = useState(null);
//   const [selectedBuild, setSelectedBuild] = useState(null);
//   const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);


//   // Query hooks
//   const { data: jobs = [], isLoading: jobsLoading } = useGetJenkinsJobsQuery();
//   const { data: buildHistory = [], isLoading: buildsLoading } = useGetJobBuildHistoryQuery(selectedJob?.name, {
//     skip: !selectedJob
//   });
//   const { data: jobDetails, isLoading: detailsLoading } = useGetJobDetailsQuery(selectedJob?.name, {
//     skip: !selectedJob
//   });
//   const { data: consoleOutput, isLoading: consoleLoading } = useGetConsoleOutputQuery(
//     { jobName: selectedJob?.name, buildNumber: selectedBuild }, 
//     { skip: !selectedJob || !selectedBuild }
//   );


//   // Mutations
//   const [triggerJob] = useTriggerJobMutation();


//   // Event Handlers
//   const handleTriggerJob = async (jobName) => {
//     try {
//       const response = await triggerJob(jobName).unwrap();
//       toast.success(`Job ${jobName} triggered successfully`);
//     } catch (error) {
//       toast.error(`Failed to trigger job: ${error.message}`);
//     }
//   };


//   // Render Methods
//   const renderJobsList = () => (
//     <div className="bg-white shadow rounded-lg p-4">
//       <h2 className="text-xl font-bold mb-4 flex items-center">
//         <List className="mr-2" /> Jenkins Jobs
//       </h2>
//       {jobsLoading ? (
//         <p>Loading jobs...</p>
//       ) : (
//         <ul className="space-y-2">
//           {jobs.map((job) => (
//             <li 
//               key={job.name}
//               className={`p-2 rounded cursor-pointer ${selectedJob?.name === job.name ? 'bg-purple-100 text-purple-800' : 'hover:bg-gray-100'}`}
//             >
//               <div className="flex justify-between items-center">
//                 <span>{job.name}</span>
//                 <div className="flex space-x-2">
//                   {/* View Build History */}
//                   <button 
//                     onClick={() => {
//                       setSelectedJob(job);
//                       setSelectedBuild(null); // Reset selected build
//                     }}
//                     className="bg-blue-500 text-white p-1 rounded hover:bg-blue-600"
//                     title="View Build History"
//                   >
//                     <Eye size={16} />
//                   </button>


//                   {/* Remote Execute */}
//                   <button 
//                     onClick={() => handleTriggerJob(job.name)}
//                     className="bg-green-500 text-white p-1 rounded hover:bg-green-600"
//                     title="Remote Execute"
//                   >
//                     <Play size={16} />
//                   </button>


//                   {/* Job Details */}
//                   <button 
//                     onClick={() => {
//                       setSelectedJob(job);
//                       setIsDetailsModalOpen(true);
//                     }}
//                     className="bg-gray-500 text-white p-1 rounded hover:bg-gray-600"
//                     title="Job Details"
//                   >
//                     <Info size={16} />
//                   </button>
//                 </div>
//               </div>
//             </li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );


//   const renderBuildHistory = () => (
//     <div className="bg-white shadow rounded-lg p-4">
//       <h2 className="text-xl font-bold mb-4 flex items-center">
//         <FileText className="mr-2" /> Build History for {selectedJob?.name}
//       </h2>
//       {buildsLoading ? (
//         <p>Loading build history...</p>
//       ) : (
//         <ul className="space-y-2">
//           {buildHistory.map((build) => (
//             <li 
//               key={build.number}
//               className={`p-2 rounded cursor-pointer ${build.result === 'SUCCESS' ? 'bg-green-50 text-green-800': build.result === 'FAILURE' ? 'bg-red-50 text-red-800' : 'bg-gray-50'}`}
//               onClick={() => {
//                 setSelectedBuild(build.number);
//               }}
//             >
//               Build #{build.number} - {build.result}
//             </li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );


//   const renderConsoleOutput = () => {
//     if (!selectedBuild) return null;


//     return (
//       <div className="bg-white shadow rounded-lg p-4">
//         <h2 className="text-xl font-bold mb-4 flex items-center">
//           <Terminal className="mr-2" /> Console Output for Build #{selectedBuild}
//         </h2>
//         {consoleLoading ? (
//           <p>Loading console output...</p>
//         ) : (
//           <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-96">
//             {consoleOutput || 'No console output available'}
//           </pre>
//         )}
//       </div>
//     );
//   };


//   const renderJobDetailsModal = () => (
//     <Dialog
//       open={isDetailsModalOpen}
//       onClose={() => setIsDetailsModalOpen(false)}
//       className="fixed inset-0 z-10 overflow-y-auto"
//     >
//       <div className="flex min-h-screen items-center justify-center">
//         <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />


//         <div className="relative bg-white rounded max-w-md mx-auto p-6 shadow-xl">
//           <Dialog.Title className="text-xl font-bold mb-4">
//             Job Details: {selectedJob?.name}
//           </Dialog.Title>


//           {detailsLoading ? (
//             <p>Loading job details...</p>
//           ) : (
//             <div className="space-y-4">
//               <div>
//                 <strong>Description:</strong>
//                 <p>{jobDetails?.description || "No description available."}</p>
//               </div>


//               <div>
//                 <strong>Project URL:</strong>
//                 <p>
//                   {jobDetails?.gitRepository ? (
//                     <a
//                       href={jobDetails.gitRepository}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="text-blue-600 hover:underline"
//                     >
//                       {jobDetails.gitRepository}
//                     </a>
//                   ) : (
//                     "No URL available."
//                   )}
//                 </p>
//               </div>


//               <div>
//                 <strong>Pipeline Script:</strong>
//                 <pre className="bg-gray-100 p-2 rounded overflow-auto">
//                   {jobDetails?.pipelineScript || "No pipeline script available."}
//                 </pre>
//               </div>
//             </div>
//           )}


//           <button
//             onClick={() => setIsDetailsModalOpen(false)}
//             className="mt-4 bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
//           >
//             Close
//           </button>
//         </div>
//       </div>
//     </Dialog>
//   );


//   return (
//     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
//       <div>{renderJobsList()}</div>
//       <div>{renderBuildHistory()}</div>
//       <div>
//         {renderConsoleOutput()}
//         {renderJobDetailsModal()}
//       </div>
//     </div>
//   );
// }


// export default Jenkins;


// import React, { useState } from 'react';
// import { 
//   useGetJenkinsJobsQuery, 
//   useGetJobBuildHistoryQuery,
//   useTriggerJobMutation,
//   useGetJobDetailsQuery,
//   useGetConsoleOutputQuery
// } from '../features/clusters/jenkinsApi';
// import { 
//   Play, 
//   FileText, 
//   List, 
//   Terminal,
//   Info,
//   Eye 
// } from 'lucide-react';
// import { toast } from 'react-toastify';
// import { Dialog } from '@headlessui/react';


// export function Jenkins() {
//   // State management
//   const [selectedJob, setSelectedJob] = useState(null);
//   const [selectedBuild, setSelectedBuild] = useState(null);
//   const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);


//   // Query hooks
//   const { data: jobs = [], isLoading: jobsLoading } = useGetJenkinsJobsQuery();
//   const { 
//     data: buildHistory = [], 
//     isLoading: buildsLoading 
//   } = useGetJobBuildHistoryQuery(selectedJob?.name, {
//     skip: !selectedJob
//   });
//   const { 
//     data: jobDetails, 
//     isLoading: detailsLoading 
//   } = useGetJobDetailsQuery(selectedJob?.name, {
//     skip: !selectedJob
//   });
//   const { 
//     data: consoleOutput, 
//     isLoading: consoleLoading 
//   } = useGetConsoleOutputQuery(
//     { 
//       jobName: selectedJob?.name, 
//       buildNumber: selectedBuild 
//     }, 
//     { skip: !selectedJob || !selectedBuild }
//   );


//   // Mutations
//   const [triggerJob] = useTriggerJobMutation();


//   // Event Handlers
//   const handleTriggerJob = async (jobName) => {
//     try {
//       await triggerJob(jobName).unwrap();
//       toast.success(`Job ${jobName} triggered successfully`);
//     } catch (error) {
//       toast.error(`Failed to trigger job: ${error.message}`);
//     }
//   };


//   // Render Methods
//   const renderJobsList = () => (
//     <div className="bg-white shadow rounded-lg p-4">
//       <h2 className="text-xl font-bold mb-4 flex items-center">
//         <List className="mr-2" /> Jenkins Jobs
//       </h2>
//       {jobsLoading ? (
//         <p>Loading jobs...</p>
//       ) : (
//         <ul className="space-y-2">
//           {jobs.map((job) => (
//             <li 
//               key={job.name}
//               className={`p-2 rounded cursor-pointer ${selectedJob?.name === job.name ? 'bg-purple-100 text-purple-800' : 'hover:bg-gray-100'}`}
//             >
//               <div className="flex justify-between items-center">
//                 <span>{job.name}</span>
//                 <div className="flex space-x-2">
//                   {/* View Build History */}
//                   <button 
//                     onClick={() => {
//                       setSelectedJob(job);
//                       setSelectedBuild(null); // Reset selected build
//                     }}
//                     className="bg-blue-500 text-white p-1 rounded hover:bg-blue-600"
//                     title="View Build History"
//                   >
//                     <Eye size={16} />
//                   </button>


//                   {/* Remote Execute */}
//                   <button 
//                     onClick={() => handleTriggerJob(job.name)}
//                     className="bg-green-500 text-white p-1 rounded hover:bg-green-600"
//                     title="Remote Execute"
//                   >
//                     <Play size={16} />
//                   </button>


//                   {/* Job Details */}
//                   <button 
//                     onClick={() => {
//                       setSelectedJob(job);
//                       setIsDetailsModalOpen(true);
//                     }}
//                     className="bg-gray-500 text-white p-1 rounded hover:bg-gray-600"
//                     title="Job Details"
//                   >
//                     <Info size={16} />
//                   </button>
//                 </div>
//               </div>
//             </li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );


//   const renderBuildHistory = () => (
//     <div className="bg-white shadow rounded-lg p-4">
//       <h2 className="text-xl font-bold mb-4 flex items-center">
//         <FileText className="mr-2" /> Build History for {selectedJob?.name}
//       </h2>
//       {buildsLoading ? (
//         <p>Loading build history...</p>
//       ) : (
//         <ul className="space-y-2">
//           {buildHistory.map((build) => (
//             <li 
//               key={build.number}
//               className={`p-2
//               rounded cursor-pointer 
//               ${build.result === 'SUCCESS' 
//                 ? 'bg-green-50 text-green-800' 
//                 : build.result === 'FAILURE' 
//                 ? 'bg-red-50 text-red-800' 
//                 : 'bg-gray-50'
//               }
//               ${selectedBuild === build.number 
//                 ? 'ring-2 ring-purple-500' 
//                 : 'hover:bg-gray-100'
//               }`}
//               onClick={() => setSelectedBuild(build.number)}
//             >
//               Build #{build.number} - {build.result || 'In Progress'}
//             </li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );


//   const renderConsoleOutput = () => {
//     if (!selectedBuild) return null;


//     return (
//       <div className="bg-white shadow rounded-lg p-4">
//         <h2 className="text-xl font-bold mb-4 flex items-center">
//           <Terminal className="mr-2" /> Console Output for Build #{selectedBuild}
//         </h2>
//         {consoleLoading ? (
//           <p>Loading console output...</p>
//         ) : (
//           <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-96">
//             {consoleOutput || 'No console output available'}
//           </pre>
//         )}
//       </div>
//     );
//   };


//   const renderJobDetailsModal = () => (
//     <Dialog
//       open={isDetailsModalOpen}
//       onClose={() => setIsDetailsModalOpen(false)}
//       className="fixed inset-0 z-10 overflow-y-auto"
//     >
//       <div className="flex min-h-screen items-center justify-center">
//         <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
//         <div className="relative bg-white rounded max-w-md mx-auto p-6 shadow-xl">
//           <Dialog.Title className="text-xl font-bold mb-4">
//             Job Details: {selectedJob?.name}
//           </Dialog.Title>
//           {detailsLoading ? (
//             <p>Loading job details...</p>
//           ) : (
//             <div className="space-y-4">
//               <div>
//                 <strong>Description:</strong>
//                 <p>{jobDetails?.description || "No description available."}</p>
//               </div>
//               <div>
//                 <strong>Project URL:</strong>
//                 <p>
//                   {jobDetails?.gitRepository ? (
//                     <a
//                       href={jobDetails.gitRepository}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="text-blue-600 hover:underline"
//                     >
//                       {jobDetails.gitRepository}
//                     </a>
//                   ) : (
//                     "No URL available."
//                   )}
//                 </p>
//               </div>
//               <div>
//                 <strong>Pipeline Script:</strong>
//                 <pre className="bg-gray-100 p-2 rounded overflow-auto">
//                   {jobDetails?.pipelineScript || "No pipeline script available."}
//                 </pre>
//               </div>
//             </div>
//           )}
//           <button
//             onClick={() => setIsDetailsModalOpen(false)}
//             className="mt-4 bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
//           >
//             Close
//           </button>
//         </div>
//       </div>
//     </Dialog>
//   );


//   return (
//     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
//       <div>{renderJobsList()}</div>
//       <div>{renderBuildHistory()}</div>
//       <div>
//         {renderConsoleOutput()}
//         {renderJobDetailsModal()}
//       </div>
//     </div>
//   );
// }


// export default Jenkins;


// import React, { useState, useCallback } from 'react';
// import { 
//   useGetJenkinsJobsQuery, 
//   useGetJobBuildHistoryQuery,
//   useTriggerJobMutation,
//   useGetJobDetailsQuery,
//   useGetConsoleOutputQuery
// } from '../features/clusters/jenkinsApi';
// import { 
//   Play, 
//   FileText, 
//   List, 
//   Terminal,
//   Info,
//   Eye,
//   RefreshCw,
//   AlertTriangle
// } from 'lucide-react';
// import { toast } from 'react-toastify';
// import { Dialog } from '@headlessui/react';


// export function Jenkins() {
//   // State management
//   const [selectedJob, setSelectedJob] = useState(null);
//   const [selectedBuild, setSelectedBuild] = useState(null);
//   const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);


//   // Query hooks
//   const { 
//     data: jobs = [], 
//     isLoading: jobsLoading, 
//     error: jobsError, 
//     refetch: refetchJobs 
//   } = useGetJenkinsJobsQuery();


//   const { 
//     data: buildHistory = [], 
//     isLoading: buildsLoading, 
//     error: buildsError, 
//     refetch: refetchBuilds 
//   } = useGetJobBuildHistoryQuery(selectedJob?.name, { 
//     skip: !selectedJob 
//   });


//   const { 
//     data: jobDetails, 
//     isLoading: detailsLoading, 
//     error: detailsError 
//   } = useGetJobDetailsQuery(selectedJob?.name, {
//     skip: !selectedJob
//   });


//   const { 
//     data: consoleOutput, 
//     isLoading: consoleLoading, 
//     error: consoleError 
//   } = useGetConsoleOutputQuery(
//     { 
//       jobName: selectedJob?.name, 
//       buildNumber: selectedBuild 
//     }, 
//     { skip: !selectedJob || !selectedBuild }
//   );


//   // Mutations
//   const [triggerJob, { isLoading: isTriggeringJob }] = useTriggerJobMutation();


//   // Error Rendering Utility
//   const renderErrorState = (error, refetchFn) => (
//     <div className="bg-red-50 border border-red-200 rounded p-4 flex items-center justify-between">
//       <div className="flex items-center space-x-3">
//         <AlertTriangle className="text-red-500" />
//         <p className="text-red-700">
//           {error?.message || 'An unexpected error occurred'}
//         </p>
//       </div>
//       <button 
//         onClick={refetchFn} 
//         className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 flex items-center"
//       >
//         <RefreshCw className="mr-2" size={16} />
//         Retry
//       </button>
//     </div>
//   );


//   // Enhanced Event Handlers
//   const handleTriggerJob = useCallback(async (jobName) => {
//     try {
//       await triggerJob(jobName).unwrap();
//       toast.success(`Job ${jobName} triggered successfully`, {
//         icon: <Play size={20} className="text-green-500" />
//       });
      
//       // Refetch jobs to get updated status
//       refetchJobs();
//     } catch (error) {
//       toast.error(`Failed to trigger job: ${error.message}`, {
//         icon: <AlertTriangle size={20} className="text-red-500" />
//       });
//     }
//   }, [triggerJob, refetchJobs]);


//   // Render Methods
//   const renderJobsList = () => (
//     <div className="bg-white shadow rounded-lg p-4">
//       <h2 className="text-xl font-bold mb-4 flex items-center">
//         <List className="mr-2" /> Jenkins Jobs
//       </h2>
      
//       {jobsError && renderErrorState(jobsError, refetchJobs)}
      
//       {jobsLoading ? (
//         <div className="flex justify-center items-center">
//           <RefreshCw className="animate-spin text-purple-500" size={24} />
//         </div>
//       ) : (
//         <ul className="space-y-2">
//           {jobs.map((job) => (
//             <li 
//               key={job.name}
//               className={`p-2 rounded cursor-pointer ${selectedJob?.name === job.name ? 'bg-purple-100 text-purple-800' : 'hover:bg-gray-100'}`}
//             >
//               <div className="flex justify-between items-center">
//                 <div>
//                   <span>{job.name}</span>
              
//                   <span className="ml-2 text-xs text-gray-500">{job.status || 'Unknown Status'}</span>
//                 </div>
//                 <div className="flex space-x-2">
//                   <button 
//                     onClick={() => {
//                       setSelectedJob(job);
//                       setSelectedBuild(null);
//                     }}
//                     className="bg-blue-500 text-white p-1 rounded hover:bg-blue-600"
//                     title="View Build History"
//                   >
//                     <Eye size={16} />
//                   </button>


//                   <button 
//                     onClick={() => handleTriggerJob(job.name)}
//                     disabled={isTriggeringJob}
//                     className={`bg-green-500 text-white p-1 rounded ${isTriggeringJob ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-600'}`}
//                     title="Remote Execute"
//                   >
//                     <Play size={16} />
//                   </button>


//                   <button 
//                     onClick={() => {
//                       setSelectedJob(job);
//                       setIsDetailsModalOpen(true);
//                     }}
//                     className="bg-gray-500 text-white p-1 rounded hover:bg-gray-600"
//                     title="Job Details"
//                   >
//                     <Info size={16} />
//                   </button>
//                 </div>
//               </div>
//             </li>
//           ))}
//         </ul>
//       )}
//     </div>
//   );




//   const renderBuildHistory = () => {
//     if (buildsError) {
//       return renderErrorState(buildsError, refetchBuilds);
//     }


//     return (
//       <div className="bg-white shadow rounded-lg p-4">
//         <h2 className="text-xl font-bold mb-4 flex items-center">
//           <FileText className="mr-2" /> Build History for {selectedJob?.name}
//         </h2>


//         {buildsLoading ? (
//           <div className="flex justify-center items-center">
//             <RefreshCw className="animate-spin text-purple-500" size={24} />
//           </div>
//         ) : buildHistory.length === 0 ? (
//           <div className="text-center text-gray-500">
//             <AlertTriangle className="mx-auto mb-2" />
//             No build history available
//           </div>
//         ) : (
//           <ul className="space-y-2">
//             {buildHistory.map((build) => {
//               const statusColors = {
//                 SUCCESS: 'bg-green-50 text-green-800 border-green-200',
//                 FAILURE: 'bg-red-50 text-red-800 border-red-200',
//                 UNSTABLE: 'bg-yellow-50 text-yellow-800 border-yellow-200',
//                 ABORTED: 'bg-gray-50 text-gray-800 border-gray-200',
//               };


//               const buildStatusClass = statusColors[build.result] || 'bg-gray-50';


//               return (
//                 <li
//                   key={build.number}
//                   className={`p-2 rounded cursor-pointer border ${buildStatusClass} ${
//                     selectedBuild === build.number ? 'ring-2 ring-purple-500' : 'hover:bg-opacity-75'
//                   }`}
//                   onClick={() => setSelectedBuild(build.number)}
//                 >
//                   <div className="flex justify-between items-center">
//                     <span>Build #{build.number}</span>
//                     <div className="flex items-center space-x-2">
//                       <span>{build.result || 'In Progress'}</span>
//                       {build.timestamp && (
//                         <span className="text-xs text-gray-600">
//                           {new Date(build.timestamp).toLocaleString()}
//                         </span>
//                       )}
//                     </div>
//                   </div>
//                 </li>
//               );
//             })}
//           </ul>
//         )}
//       </div>
//     );
//   };




//   const renderConsoleOutput = () => {
//     if (consoleError) {
//       return (
//         <div className="bg-white shadow rounded-lg p-4">
//           {renderErrorState(consoleError, () => {
//             // Refetch console output
//             refetchConsoleOutput();
//           })}
//         </div>
//       );
//     }


//     return (
//       <div className="bg-white shadow rounded-lg p-4">
//         <h2 className="text-xl font-bold mb-4 flex items-center">
//           <Terminal className="mr-2" /> Console Output for Build #{selectedBuild}
//         </h2>


//         {consoleLoading ? (
//           <div className="flex justify-center items-center">
//             <RefreshCw className="animate-spin text-purple-500" size={24} />
//           </div>
//         ) : (
//           <div>
//             {consoleOutput ? (
            

//               <pre className="bg-gray-100 p-2 rounded overflow-auto max-h-96 text-xs font-mono">
//                 {consoleOutput}
//               </pre>
//             ) : (
//               <div className="text-center text-gray-500">
//                 <AlertTriangle className="mx-auto mb-2" />
//                 No console output available
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     );
//   };




//   const renderJobDetailsModal = () => {
//     if (detailsError) {
//       return (
//         <Dialog
//           open={isDetailsModalOpen}
//           onClose={() => setIsDetailsModalOpen(false)}
//           className="fixed inset-0 z-10 overflow-y-auto"
//         >
//           <div className="flex min-h-screen items-center justify-center">
//             <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
//             <div className="relative bg-white rounded max-w-md mx-auto p-6 shadow-xl">
//               {renderErrorState(detailsError, () => {
//                 // Refetch job details
//                 refetchJobDetails();
//               })}
//               <button
//                 onClick={() => setIsDetailsModalOpen(false)}
//                 className="mt-4 bg-red-500 text-white p-2 rounded hover:bg-red-600"
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </Dialog>
//       );
//     }




//     return (
//       <Dialog
//         open={isDetailsModalOpen}
//         onClose={() => setIsDetailsModalOpen(false)}
//         className="fixed inset-0 z-10 overflow-y-auto"
//       >
//         <div className="flex min-h-screen items-center justify-center">
//           <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
//           <div className="relative bg-white rounded max-w-md mx-auto p-6 shadow-xl">
//             {detailsLoading ? (
//               <div className="flex justify-center items-center">
//                 <RefreshCw className="animate-spin text-purple-500" size={24} />
//               </div>
//             ) : (
//               <>
//                 <Dialog.Title className="text-xl font-bold mb-4 flex items-center">
//                   <Info className="mr-2" /> Job Details: {selectedJob?.name}
//                 </Dialog.Title>
                
//                 <div className="space-y-4">
//                   <div>
//                     <strong className="block mb-1">Description:</strong>
//                     <p className="text-gray-600">
//                       {jobDetails?.description || "No description available."}
//                     </p>
//                   </div>
                  
//                   <div>
//                     <strong className="block mb-1">Last Build:</strong>
//                     {jobDetails?.lastBuild ? (
//                       <div className="bg-gray-50 p-2 rounded">
//                         <p>Number: #{jobDetails.lastBuild.number}</p>
//                         <p>
//                           Timestamp: {new Date(jobDetails.lastBuild.timestamp).toLocaleString()}
//                         </p>
//                         <p>Result: {jobDetails.lastBuild.result}</p>
//                       </div>
//                     ) : (
//                       <p className="text-gray-500">No build information available</p>
//                     )}
//                   </div>
                  
//                   <div>
//                     <strong className="block mb-1">Job URL:</strong>
//                     {jobDetails?.url ? (
//                       <a
//                         href={jobDetails.url}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         className="text-blue-600 hover:underline break-all"
//                       >
//                         {jobDetails.url}
//                       </a>
//                     ) : (
//                       <p className="text-gray-500">No URL available</p>
//                     )}
//                   </div>
//                 </div>
                
//                 <div className="mt-6 flex justify-end space-x-2">
//                   <button
//                     onClick={() => setIsDetailsModalOpen(false)}
//                     className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
//                   >
//                     Close
//                   </button>
//                 </div>
//               </>
//             )}
//           </div>
//         </div>
//       </Dialog>
//     );
//   };




//   return (
//     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
//       <div>{renderJobsList()}</div>
//       <div>{renderBuildHistory()}</div>
//       <div>
//         {renderConsoleOutput()}
//         {renderJobDetailsModal()}
//       </div>
//     </div>
//   );

// }



// export default Jenkins;

// import React,{ useState, useEffect } from 'react';
// import { Card, CardHeader, CardContent } from '../components/ui/card';
// import { Loader2 } from 'lucide-react';


// const Jenkins = () => {
//   const [jobs, setJobs] = useState([]);
//   const [selectedJob, setSelectedJob] = useState(null);
//   const [jobDetails, setJobDetails] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   const baseUrl = 'http://10.200.16.17:8080'; 
  
//   const getHeaders = () => {
//     const username = 'jenkins';
//     const token = '113c0729b83dabd474a7d4a5a5849a4188';
//     const base64Credentials = btoa(`${username}:${token}`);
    
//     return {
//       'Authorization': `Basic ${base64Credentials}`,
//       'Accept': 'application/json'
//     };
//   };

//   const fetchJobs = async () => {
//     try {
//       setLoading(true);
//       const response = await fetch(
//         `${baseUrl}/api/json?tree=jobs[name,url,color,description,lastBuild[number,timestamp,result]]`, 
//         { headers: getHeaders() }
//       );
      
//       if (!response.ok) {
//         throw new Error(`API request failed with status: ${response.status}`);
//       }
      
//       const data = await response.json();
//       setJobs(data.jobs);
//       setError(null);
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchJobDetails = async (jobName) => {
//     try {
//       const response = await fetch(
//         `${baseUrl}/job/${jobName}/api/json?tree=builds[number,url,result,timestamp,duration]`,
//         { headers: getHeaders() }
//       );
      
//       if (!response.ok) {
//         throw new Error(`Failed to fetch job details: ${response.status}`);
//       }
      
//       const data = await response.json();
//       setJobDetails(data);
//     } catch (err) {
//       setError(err.message);
//     }
//   };

//   const triggerJob = async (jobName) => {
//     try {
//       const response = await fetch(`${baseUrl}/job/${jobName}/build`, {
//         method: 'POST',
//         headers: getHeaders()
//       });
      
//       if (!response.ok) {
//         throw new Error(`Failed to trigger job: ${response.status}`);
//       }
      
//       await fetchJobs(); 
//     } catch (err) {
//       setError(err.message);
//     }
//   };

//   useEffect(() => {
//     fetchJobs();
//   }, []);

//   useEffect(() => {
//     if (selectedJob) {
//       fetchJobDetails(selectedJob);
//     }
//   }, [selectedJob]);

//   const getStatusColor = (color) => {
//     if (color === 'blue' || color === 'blue_anime') return 'bg-green-100 text-green-800';
//     if (color === 'red' || color === 'red_anime') return 'bg-red-100 text-red-800';
//     if (color === 'yellow' || color === 'yellow_anime') return 'bg-yellow-100 text-yellow-800';
//     if (color === 'disabled') return 'bg-gray-100 text-gray-800';
//     return 'bg-gray-100 text-gray-800';
//   };

//   const getStatusText = (color) => {
//     if (color?.includes('_anime')) return 'In Progress';
//     if (color === 'blue') return 'Success';
//     if (color === 'red') return 'Failed';
//     if (color === 'yellow') return 'Unstable';
//     if (color === 'disabled') return 'Disabled';
//     return 'N/A';
//   };

//   if (loading) {
//     return (
//       <div className="flex items-center justify-center h-64">
//         <Loader2 className="w-8 h-8 animate-spin" />
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="p-4 text-red-600 bg-red-50 rounded-md">
//         Error: {error}
//         <button 
//           onClick={fetchJobs} 
//           className="ml-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
//         >
//           Retry
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="p-4 space-y-4">
//       <div className="flex justify-between items-center mb-4">
//         <h1 className="text-2xl font-bold">Jenkins Jobs Dashboard</h1>
//         <button 
//           onClick={fetchJobs}
//           className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
//         >
//           Refresh
//         </button>
//       </div>
      
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//         {jobs.map((job) => (
//           <Card key={job.name} className="hover:shadow-lg transition-shadow">
//             <CardHeader>
//               <div className="flex items-center justify-between">
//                 <h2 className="text-lg font-semibold">{job.name}</h2>
//                 <span className={`px-2 py-1 rounded-full text-sm ${getStatusColor(job.color)}`}>
//                   {getStatusText(job.color)}
//                 </span>
//               </div>
//             </CardHeader>
            
//             <CardContent>
//               <p className="text-gray-600 mb-4 line-clamp-2">
//                 {job.description || 'No description'}
//               </p>
              
//               <div className="flex items-center justify-between">
//                 <button
//                   onClick={() => setSelectedJob(selectedJob === job.name ? null : job.name)}
//                   className="text-blue-600 hover:text-blue-800"
//                 >
//                   {selectedJob === job.name ? 'Hide Details' : 'View Details'}
//                 </button>
                
//                 <button
//                   onClick={() => triggerJob(job.name)}
//                   className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
//                 >
//                   Build Now
//                 </button>
//               </div>

//               {selectedJob === job.name && jobDetails && (
//                 <div className="mt-4 p-4 bg-gray-50 rounded">
//                   <h3 className="font-semibold mb-2">Recent Builds</h3>
//                   <div className="space-y-2">
//                     {jobDetails.builds?.slice(0, 5).map((build) => (
//                       <div 
//                         key={build.number} 
//                         className="flex justify-between items-center text-sm"
//                       >
//                         <span>#{build.number}</span>
//                         <span className={`px-2 py-1 rounded-full ${
//                           build.result === 'SUCCESS' ? 'bg-green-100 text-green-800' :
//                           build.result === 'FAILURE' ? 'bg-red-100 text-red-800' :
//                           'bg-gray-100 text-gray-800'
//                         }`}>
//                           {build.result || 'IN PROGRESS'}
//                         </span>
//                         <span className="text-gray-600">
//                           {new Date(build.timestamp).toLocaleString()}
//                         </span>
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//               )}
//             </CardContent>
//           </Card>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default Jenkins;



// import React, { useState, useCallback, useEffect } from 'react';
// import { 
//   Play, 
//   FileText, 
//   List, 
//   Terminal,
//   Info,
//   Eye,
//   RefreshCw,
//   AlertTriangle,
//   Loader2,
//   X
// } from 'lucide-react';
// import { Card, CardHeader, CardContent } from '../components/ui/card';
// import { Dialog } from '@headlessui/react';

// const Modal = ({ isOpen, onClose, children }) => {
//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
//       <div className="bg-white rounded-lg p-6 w-full max-w-2xl relative">
//         <button 
//           onClick={onClose} 
//           className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
//         >
//           <X size={20} />
//         </button>
//         {children}
//       </div>
//     </div>
//   );
// };

// export function Jenkins() {
//   // State Management
//   const [jobs, setJobs] = useState([]);
//   const [selectedJob, setSelectedJob] = useState(null);
//   const [selectedBuild, setSelectedBuild] = useState(null);
//   const [buildHistory, setBuildHistory] = useState([]);
//   const [consoleOutput, setConsoleOutput] = useState('');
//   const [jobDetails, setJobDetails] = useState(null);
//   const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
//   const [loading, setLoading] = useState({
//     jobs: false,
//     builds: false,
//     console: false,
//     details: false
//   });
//   const [error, setError] = useState({
//     jobs: null,
//     builds: null,
//     console: null,
//     details: null
//   });

//   // API Configuration
//   const baseUrl = 'http://10.200.16.17:8080';
  
//   const getHeaders = () => {
//     const username = 'jenkins';
//     const token = '113c0729b83dabd474a7d4a5a5849a4188';
//     const base64Credentials = btoa(`${username}:${token}`);
    
//     return {
//       'Authorization': `Basic ${base64Credentials}`,
//       'Accept': 'application/json'
//     };
//   };

//   // API Calls
//   const fetchJobs = async () => {
//     try {
//       setLoading(prev => ({ ...prev, jobs: true }));
//       const response = await fetch(
//         `${baseUrl}/api/json?tree=jobs[name,url,color,description,lastBuild[number,timestamp,result]]`,
//         { headers: getHeaders() }
//       );

//       if (!response.ok) throw new Error(`API request failed with status: ${response.status}`);
      
//       const data = await response.json();
//       setJobs(data.jobs);
//       setError(prev => ({ ...prev, jobs: null }));
//     } catch (err) {
//       setError(prev => ({ ...prev, jobs: err.message }));
//     } finally {
//       setLoading(prev => ({ ...prev, jobs: false }));
//     }
//   };

//   const getJobDetails = async (jobName) => {
//     try {
//       setLoading(prev => ({ ...prev, details: true }));
//       const response = await fetch(
//         `${baseUrl}/job/${jobName}/api/json`,
//         { headers: getHeaders() }
//       );
      
//       if (!response.ok) {
//         throw new Error('Failed to fetch job details');
//       }
      
//       const data = await response.json();
//       console.log(data)
//       setJobDetails(data);
//       setIsModalOpen(true);
//     } catch (error) {
//       setError(prev => ({ ...prev, details: error.message }));
//     } finally {
//       setLoading(prev => ({ ...prev, details: false }));
//     }
//   };

//   const fetchBuildHistory = async (jobName) => {
//     if (!jobName) return;
    
//     try {
//       setLoading(prev => ({ ...prev, builds: true }));
//       const response = await fetch(
//         `${baseUrl}/job/${jobName}/api/json?tree=builds[number,url,result,timestamp,duration]`,
//         { headers: getHeaders() }
//       );

//       if (!response.ok) throw new Error(`Failed to fetch build history: ${response.status}`);
      
//       const data = await response.json();
//       setBuildHistory(data.builds || []);
//       setError(prev => ({ ...prev, builds: null }));
//     } catch (err) {
//       setError(prev => ({ ...prev, builds: err.message }));
//     } finally {
//       setLoading(prev => ({ ...prev, builds: false }));
//     }
//   };

//   const fetchConsoleOutput = async (jobName, buildNumber) => {
//     if (!jobName || !buildNumber) return;
    
//     try {
//       setLoading(prev => ({ ...prev, console: true }));
//       const response = await fetch(
//         `${baseUrl}/job/${jobName}/${buildNumber}/consoleText`,
//         { headers: getHeaders() }
//       );

//       // if (!response.ok) throw new Error(`Failed to fetch console output: ${response.status}`);
//       if (!response.ok) throw new Error(`Select a build from build history`);

//       const text = await response.text();
//       setConsoleOutput(text);
//       setError(prev => ({ ...prev, console: null }));
//     } catch (err) {
//       setError(prev => ({ ...prev, console: err.message }));
//     } finally {
//       setLoading(prev => ({ ...prev, console: false }));
//     }
//   };

//   const fetchJobDetails = async (jobName) => {
//     if (!jobName) return;
    
//     try {
//       setLoading(prev => ({ ...prev, details: true }));
//       const response = await fetch(
//         `${baseUrl}/job/${jobName}/api/json`,
//         { headers: getHeaders() }
//       );

//       if (!response.ok) throw new Error(`Failed to fetch job details: ${response.status}`);
      
//       const data = await response.json();
//       setJobDetails(data);
//       setError(prev => ({ ...prev, details: null }));
//     } catch (err) {
//       setError(prev => ({ ...prev, details: err.message }));
//     } finally {
//       setLoading(prev => ({ ...prev, details: false }));
//     }
//   };

//   const triggerJob = async (jobName) => {
//     try {
//       const response = await fetch(
//         `${baseUrl}/job/${jobName}/build`,
//         { 
//           method: 'POST',
//           headers: getHeaders()
//         }
//       );

//       if (!response.ok) throw new Error(`Failed to trigger job: ${response.status}`);
      
//       // Refetch data after triggering
//       await fetchJobs();
//       if (selectedJob?.name === jobName) {
//         await fetchBuildHistory(jobName);
//       }
//     } catch (err) {
//       setError(prev => ({ ...prev, jobs: err.message }));
//     }
//   };

//   // Effects
//   useEffect(() => {
//     fetchJobs();
//   }, []);

//   useEffect(() => {
//     if (selectedJob) {
//       fetchBuildHistory(selectedJob.name);
//       fetchJobDetails(selectedJob.name);
//     }
//   }, [selectedJob]);

//   useEffect(() => {
//     if (selectedJob?.name && selectedBuild) {
//       fetchConsoleOutput(selectedJob.name, selectedBuild);
//     }
//   }, [selectedJob, selectedBuild]);

//   // Utility Functions
//   const getStatusColor = useCallback((color) => {
//     if (color === 'blue' || color === 'blue_anime') return 'bg-green-100 text-green-800';
//     if (color === 'red' || color === 'red_anime') return 'bg-red-100 text-red-800';
//     if (color === 'yellow' || color === 'yellow_anime') return 'bg-yellow-100 text-yellow-800';
//     return 'bg-gray-100 text-gray-800';
//   }, []);

//   const getStatusText = useCallback((color) => {
//     if (color?.includes('_anime')) return 'In Progress';
//     if (color === 'blue') return 'Success';
//     if (color === 'red') return 'Failed';
//     if (color === 'yellow') return 'Unstable';
//     if (color === 'disabled') return 'Disabled';
//     return 'N/A';
//   }, []);

//   // Render Methods
//   const renderErrorState = (error, retryFn) => (
//     <div className="bg-red-50 border border-red-200 rounded p-4 flex items-center justify-between">
//       <div className="flex items-center space-x-3">
//         <AlertTriangle className="text-red-500" />
//         <p className="text-red-700">{error}</p>
//       </div>
//       <button 
//         onClick={retryFn}
//         className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 flex items-center"
//       >
//         <RefreshCw className="mr-2" size={16} />
//         Retry
//       </button>
//     </div>
//   );

//   const renderJobCard = (job) => (
//     <Card key={job.name} className="hover:shadow-lg transition-shadow">
//       <CardHeader>
//         <div className="flex items-center justify-between">
//           <h2 className="text-lg font-semibold">{job.name}</h2>
//           <span className={`px-2 py-1 rounded-full text-sm ${
//             job.color === 'blue' ? 'bg-green-100 text-green-800' :
//             job.color === 'red' ? 'bg-red-100 text-red-800' :
//             'bg-gray-100 text-gray-800'
//           }`}>
//             {job.color === 'blue' ? 'Success' : 
//              job.color === 'red' ? 'Failed' : 
//              'Unknown'}
//           </span>
//         </div>
//       </CardHeader>
      
//       <CardContent>
//         <p className="text-gray-600 mb-4 line-clamp-2">
//           {job.description || 'No description'}
//         </p>
        
//         <div className="flex space-x-2">
//           <button 
//             onClick={() => setSelectedJob(selectedJob?.name === job.name ? null : job)}
//             className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
//           >
//             <Eye size={16} />
//             <span>{selectedJob?.name === job.name ? 'Hide Details' : 'View Details'}</span>
//           </button>
          
//           <button
//             onClick={() => triggerJob(job.name)}
//             className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
//           >
//             <Play size={16} />
//             <span>Build Now</span>
//           </button>
          
//           <button
//             onClick={() => getJobDetails(job.name)}
//             className="flex items-center space-x-1 px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
//           >
//             <Info size={16} />
//             <span>Info</span>
//           </button>
//         </div>
//       </CardContent>
//     </Card>
//   );

//   return (
//     <div className="container mx-auto p-4">
//     <div className="flex justify-between items-center mb-6">
//       <h1 className="text-2xl font-bold">Jenkins Jobs Dashboard</h1>
//       <button 
//         onClick={fetchJobs}
//         className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 flex items-center space-x-2"
//       >
//         <RefreshCw size={16} />
//         <span>Refresh</span>
//       </button>
//     </div>


//       {loading.jobs ? (
//         <div className="flex items-center justify-center h-64">
//           <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
//         </div>
//       ) : error.jobs ? (
//         renderErrorState(error.jobs, fetchJobs)
//       ) : (
//         <div className="grid grid-cols-1 gap-4">
//           {jobs.map(renderJobCard)}
//         </div>
//       )}

//       {selectedJob && (
//         <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
//           {/* Build History */}
//           <Card>
//             <CardHeader>
//               <h2 className="text-xl font-bold flex items-center">
//                 <FileText className="mr-2" /> Build History
//               </h2>
//             </CardHeader>
//             <CardContent>
//               {loading.builds ? (
//                 <div className="flex justify-center p-4">
//                   <Loader2 className="animate-spin" />
//                 </div>
//               ) : error.builds ? (
//                 renderErrorState(error.builds, () => fetchBuildHistory(selectedJob.name))
//               ) : (
//                 <div className="space-y-2">
//                   {buildHistory.map((build) => (
//                     <div
//                       key={build.number}
//                       onClick={() => setSelectedBuild(build.number)}
//                       className={`p-2 rounded cursor-pointer ${
//                         selectedBuild === build.number
//                           ? 'bg-purple-100 border-purple-300'
//                           : 'hover:bg-gray-100'
//                       }`}
//                     >
//                       <div className="flex justify-between items-center">
//                         <span>Build #{build.number}</span>
//                         <span className={getStatusColor(build.result)}>
//                           {build.result || 'In Progress'}
//                         </span>
//                       </div>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </CardContent>
//           </Card>

//           {/* Console Output */}
//           {selectedBuild && (
//             <Card>
//               <CardHeader>
//                 <h2 className="text-xl font-bold flex items-center">
//                   <Terminal className="mr-2" /> Console Output
//                 </h2>
//               </CardHeader>
//               <CardContent>
//                 {loading.console ? (
//                   <div className="flex justify-center p-4">
//                     <Loader2 className="animate-spin" />
//                   </div>
//                 ) : error.console ? (
//                   renderErrorState(error.console, () => 
//                     fetchConsoleOutput(selectedJob.name, selectedBuild)
//                   )
//                 ) : (
//                   <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-sm">
//                     {consoleOutput || 'No console output available'}
//                   </pre>
//                 )}
//               </CardContent>
//             </Card>
//           )}
//         </div>
//       )}
//       {/* Job Details Modal */}
//       <Dialog
//         open={isDetailsModalOpen}
//         onClose={() => setIsDetailsModalOpen(false)}
//         className="fixed inset-0 z-50 overflow-y-auto"
//       >
//         <div className="flex items-center justify-center min-h-screen">
//           <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
          
//           <div className="relative bg-white rounded-lg max-w-2xl mx-auto p-6">
//             {loading.details ? (
//               <div className="flex justify-center p-4">
//                 <Loader2 className="animate-spin" />
//               </div>
//             ) : error.details ? (
//               renderErrorState(error.details, () => fetchJobDetails(selectedJob.name))
//             ) : (
//               <>
//                 <Dialog.Title className="text-lg font-medium mb-4">
//                   Job Details: {selectedJob?.name}
//                 </Dialog.Title>
                
//                 <div className="space-y-4">
//                   <div>
//                     <h3 className="font-medium">Description</h3>
//                     <p className="text-gray-600">
//                       {jobDetails?.description || 'No description available'}
//                     </p>
//                   </div>
                  
//                   <div>
//                     <h3 className="font-medium">URL</h3>
//                     <a 
//                       href={jobDetails?.url} 
//                       className="text-blue-600 hover:underline"
//                       target="_blank"
//                       rel="noopener noreferrer"
//                     >
//                       {jobDetails?.url}
//                     </a>
//                   </div>
//                 </div>

//                 <div className="mt-6 flex justify-end">
//                   <button
//                     onClick={() => setIsDetailsModalOpen(false)}
//                     className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
//                   >
//                     Close
//                   </button>
//                 </div>
//                 </>
//             )}
//           </div>
//         </div>
//       </Dialog>
      
//     </div>
    
//   );
// }

// export default Jenkins;



// import React, { useState, useCallback, useEffect } from 'react';
// import { 
//   Play, 
//   FileText, 
//   List, 
//   Terminal,
//   Info,
//   Eye,
//   RefreshCw,
//   AlertTriangle,
//   Loader2,
//   X
// } from 'lucide-react';
// import { Card, CardHeader, CardContent } from '../components/ui/card';
// import { Dialog } from '@headlessui/react';

// const Modal = ({ isOpen, onClose, children, title}) => {
//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
//       <div className="bg-white rounded-lg p-6 w-full max-w-2xl relative">
//         <div className="flex justify-between items-center mb-4">
//           <h2 className="text-xl font-semibold">{title}</h2>
//           <button 
//             onClick={onClose} 
//             className="text-gray-500 hover:text-gray-700"
//           >
//             <X size={20} />
//           </button>
//         </div>
//         {children}
//       </div>
//     </div>
//   );
// };


// export function Jenkins() {
//    // State Management
//    const [jobs, setJobs] = useState([]);
//    const [selectedJob, setSelectedJob] = useState(null);
//    const [selectedBuild, setSelectedBuild] = useState(null);
//    const [buildHistory, setBuildHistory] = useState([]);
//    const [consoleOutput, setConsoleOutput] = useState('');
//    const [jobDetails, setJobDetails] = useState(null);
//    const [isConsoleModalOpen, setIsConsoleModalOpen] = useState(false);
//    const [loading, setLoading] = useState({
//      jobs: false,
//      builds: false,
//      console: false,
//      details: false
//    });
//    const [error, setError] = useState({
//      jobs: null,
//      builds: null,
//      console: null,
//      details: null
//    });
//   // API Configuration
//   const baseUrl = 'http://10.200.16.17:8080';
  
//   const getHeaders = () => {
//     const username = 'jenkins';
//     const token = '113c0729b83dabd474a7d4a5a5849a4188';
//     const base64Credentials = btoa(`${username}:${token}`);
    
//     return {
//       'Authorization': `Basic ${base64Credentials}`,
//       'Accept': 'application/json'
//     };
//   };

//   // API Calls
//   const fetchJobs = async () => {
//     try {
//       setLoading(prev => ({ ...prev, jobs: true }));
//       const response = await fetch(
//         `${baseUrl}/api/json?tree=jobs[name,url,color,description,lastBuild[number,timestamp,result]]`,
//         { headers: getHeaders() }
//       );

//       if (!response.ok) throw new Error(`API request failed with status: ${response.status}`);
      
//       const data = await response.json();
//       setJobs(data.jobs);
//       setError(prev => ({ ...prev, jobs: null }));
//     } catch (err) {
//       setError(prev => ({ ...prev, jobs: err.message }));
//     } finally {
//       setLoading(prev => ({ ...prev, jobs: false }));
//     }
//   };

//   const getJobDetails = async (jobName) => {
//     try {
//       setLoading(prev => ({ ...prev, details: true }));
//       const response = await fetch(
//         `${baseUrl}/job/${jobName}/api/json`,
//         { headers: getHeaders() }
//       );
      
//       if (!response.ok) {
//         throw new Error('Failed to fetch job details');
//       }
      
//       const data = await response.json();
//       console.log(data)
//       setJobDetails(data);
//       setIsModalOpen(true);
//     } catch (error) {
//       setError(prev => ({ ...prev, details: error.message }));
//     } finally {
//       setLoading(prev => ({ ...prev, details: false }));
//     }
//   };

//   const fetchBuildHistory = async (jobName) => {
//     if (!jobName) return;
    
//     try {
//       setLoading(prev => ({ ...prev, builds: true }));
//       const response = await fetch(
//         `${baseUrl}/job/${jobName}/api/json?tree=builds[number,url,result,timestamp,duration]`,
//         { headers: getHeaders() }
//       );

//       if (!response.ok) throw new Error(`Failed to fetch build history: ${response.status}`);
      
//       const data = await response.json();
//       setBuildHistory(data.builds || []);
//       setError(prev => ({ ...prev, builds: null }));
//     } catch (err) {
//       setError(prev => ({ ...prev, builds: err.message }));
//     } finally {
//       setLoading(prev => ({ ...prev, builds: false }));
//     }
//   };

//   const fetchConsoleOutput = async (jobName, buildNumber) => {
//     if (!jobName || !buildNumber) return;
    
//     try {
//       setLoading(prev => ({ ...prev, console: true }));
//       const response = await fetch(
//         `${baseUrl}/job/${jobName}/${buildNumber}/consoleText`,
//         { headers: getHeaders() }
//       );

//       // if (!response.ok) throw new Error(`Failed to fetch console output: ${response.status}`);
//       if (!response.ok) throw new Error(`Select a build from build history`);

//       const text = await response.text();
//       setConsoleOutput(text);
//       setError(prev => ({ ...prev, console: null }));
//     } catch (err) {
//       setError(prev => ({ ...prev, console: err.message }));
//     } finally {
//       setLoading(prev => ({ ...prev, console: false }));
//     }
//   };

//   const fetchJobDetails = async (jobName) => {
//     if (!jobName) return;
    
//     try {
//       setLoading(prev => ({ ...prev, details: true }));
//       const response = await fetch(
//         `${baseUrl}/job/${jobName}/api/json`,
//         { headers: getHeaders() }
//       );

//       if (!response.ok) throw new Error(`Failed to fetch job details: ${response.status}`);
      
//       const data = await response.json();
//       setJobDetails(data);
//       setError(prev => ({ ...prev, details: null }));
//     } catch (err) {
//       setError(prev => ({ ...prev, details: err.message }));
//     } finally {
//       setLoading(prev => ({ ...prev, details: false }));
//     }
//   };

//   const triggerJob = async (jobName) => {
//     try {
//       const response = await fetch(
//         `${baseUrl}/job/${jobName}/build`,
//         { 
//           method: 'POST',
//           headers: getHeaders()
//         }
//       );

//       if (!response.ok) throw new Error(`Failed to trigger job: ${response.status}`);
      
//       // Refetch data after triggering
//       await fetchJobs();
//       if (selectedJob?.name === jobName) {
//         await fetchBuildHistory(jobName);
//       }
//     } catch (err) {
//       setError(prev => ({ ...prev, jobs: err.message }));
//     }
//   };

//   // Effects
//   useEffect(() => {
//     fetchJobs();
//   }, []);

//   useEffect(() => {
//     if (selectedJob) {
//       fetchBuildHistory(selectedJob.name);
//       fetchJobDetails(selectedJob.name);
//     }
//   }, [selectedJob]);

//   useEffect(() => {
//     if (selectedJob?.name && selectedBuild) {
//       fetchConsoleOutput(selectedJob.name, selectedBuild);
//     }
//   }, [selectedJob, selectedBuild]);
//     // Additional method to open console output modal
//     const openConsoleModal = async (jobName, buildNumber) => {
//       setSelectedBuild(buildNumber);
//       await fetchConsoleOutput(jobName, buildNumber);
//       setIsConsoleModalOpen(true);
//     };

//   // Utility Functions
//   const getStatusColor = useCallback((color) => {
//     if (color === 'blue' || color === 'blue_anime') return 'bg-green-100 text-green-800';
//     if (color === 'red' || color === 'red_anime') return 'bg-red-100 text-red-800';
//     if (color === 'yellow' || color === 'yellow_anime') return 'bg-yellow-100 text-yellow-800';
//     return 'bg-gray-100 text-gray-800';
//   }, []);

//   const getStatusText = useCallback((color) => {
//     if (color?.includes('_anime')) return 'In Progress';
//     if (color === 'blue') return 'Success';
//     if (color === 'red') return 'Failed';
//     if (color === 'yellow') return 'Unstable';
//     if (color === 'disabled') return 'Disabled';
//     return 'N/A';
//   }, []);

//     // Render Methods
//     const renderErrorState = (error, retryFn) => (
//       <div className="bg-red-50 border border-red-200 rounded p-4 flex items-center justify-between">
//         <div className="flex items-center space-x-3">
//           <AlertTriangle className="text-red-500" />
//           <p className="text-red-700">{error}</p>
//         </div>
//         <button 
//           onClick={retryFn}
//           className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200 flex items-center"
//         >
//           <RefreshCw className="mr-2" size={16} />
//           Retry
//         </button>
//       </div>
//     );
//     const renderJobCard = (job) => (
//       <Card 
//         key={job.name} 
//         className={`hover:shadow-lg transition-shadow ${
//           selectedJob?.name === job.name ? 'border-purple-500 border-2' : ''
//         }`}
//       >
//         <CardHeader>
//           <div className="flex items-center justify-between">
//             <h2 className="text-lg font-semibold">{job.name}</h2>
//             <span className={`px-2 py-1 rounded-full text-sm ${
//               job.color === 'blue' ? 'bg-green-100 text-green-800' :
//               job.color === 'red' ? 'bg-red-100 text-red-800' :
//               'bg-gray-100 text-gray-800'
//             }`}>
//               {job.color === 'blue' ? 'Success' : 
//                job.color === 'red' ? 'Failed' : 
//                'Unknown'}
//             </span>
//           </div>
//         </CardHeader>
        
//         <CardContent>
//           <p className="text-gray-600 mb-4 line-clamp-2">
//             {job.description || 'No description'}
//           </p>
          
//           <div className="flex gap-[232px]">
//             <button 
//               onClick={() => setSelectedJob(job)}
//               className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
//             >
//               <Eye size={16} />
//               <span>View Details</span>
//             </button>
            
//             <button
//               onClick={() => triggerJob(job.name)}
//               className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
//             >
//               <Play size={16} />
//               <span>Build Now</span>
//             </button>
//           </div>
//         </CardContent>
//       </Card>
//     );
  
  
//     return (
//       <div className="container mx-auto p-4">
//         <div className="grid grid-cols-[500px_1fr] gap-4">
//           {/* Left Column: Jobs */}
//           <div>
//             <div className="flex justify-between items-center mb-6">
//               <h1 className="text-2xl font-bold">Jenkins Jobs</h1>
//               <button 
//                 onClick={fetchJobs}
//                 className="px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
//               >
//                 <RefreshCw size={16} />
//               </button>
//             </div>
  
  
//             {loading.jobs ? (
//               <div className="flex justify-center">
//                 <Loader2 className="animate-spin" />
//               </div>
//             ) : error.jobs ? (
//               renderErrorState(error.jobs, fetchJobs)
//             ) : (
//               <div className="space-y-4">
//                 {jobs.map(renderJobCard)}
//               </div>
//             )}
//           </div>
  
  
//           {/* Right Column: Job Details */}
//           <div>
//             {selectedJob ? (
//               <Card>
//                 <CardHeader>
//                   <h2 className="text-xl font-bold">
//                     {selectedJob.name} Details
//                   </h2>
//                 </CardHeader>
//                 <CardContent>
//                   {/* Build History */}
//                   <div>
//                     <h3 className="font-semibold mb-2">Build History</h3>
//                     {loading.builds ? (
//                       <div className="flex justify-center">
//                         <Loader2 className="animate-spin" />
//                       </div>
//                     ) : error.builds ? (
//                       renderErrorState(error.builds, () => fetchBuildHistory(selectedJob.name))
//                     )
//                     : (
//                       <div className="space-y-2">
//                         {buildHistory.map((build) => (
//                           <div
//                             key={build.number}
//                             onClick={() => openConsoleModal(selectedJob.name, build.number)}
//                             className={`p-2 rounded cursor-pointer ${
//                               selectedBuild === build.number
//                                 ? 'bg-purple-100 border border-purple-300'
//                                 : 'hover:bg-gray-100'
//                             }`}
//                           >
//                             <div className="flex justify-between items-center">
//                               <span>Build #{build.number}</span>
//                               <span className={getStatusColor(build.result)}>
//                                 {build.result || 'In Progress'}
//                               </span>
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     )}
//                   </div>
//                 </CardContent>
//               </Card>
//             ) : (
//               <div className="text-center text-gray-500">
//                 Select a job to view details
//               </div>
//             )}
//           </div>
//         </div>
  
  
//         {/* Console Output Modal */}
//         <Modal 
//           isOpen={isConsoleModalOpen} 
//           onClose={() => setIsConsoleModalOpen(false)} 
//           title={`Console Output - Build #${selectedBuild}`}
//         >
//           <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-[500px] text-sm">
//             {consoleOutput || 'No console output available'}
//           </pre>
//         </Modal>
//       </div>
//     );
//   }
  
  
//   export default Jenkins;


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