import React, { useState } from "react";
import {
  useUploadDeploymentMutation,
  useUpdateImageMutation,
  useUpdateReplicasMutation,
  useGetClusterDetailsQuery,
  useDeleteDeploymentMutation,
  useDeletePodMutation,
} from "../features/clusters/clusterApi";
import { toast } from "react-toastify";
import {
  Server,
  Box,
  Database,
  Terminal,
  Activity,
  Server as ServerIcon,
  Edit2,
  RefreshCw,
  Upload,
  Trash2
} from "lucide-react";




export function ImagesSection({  clusterName }) {
  /** @type {[File | null, function]} */
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadDeployment] = useUploadDeploymentMutation();
  const [imageSuggestions, setImageSuggestions] = useState([]);
const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [updateImage] = useUpdateImageMutation();
  const [updateReplicas] = useUpdateReplicasMutation();
  const { data: clusterDetails } = useGetClusterDetailsQuery(clusterName);
  const [deleteDeployment] = useDeleteDeploymentMutation();
  const parsedImages = Array.isArray(clusterDetails.deployments)
    ? clusterDetails.deployments.map((deployment) => ({
        deployment: deployment.name,
        namespace: deployment.namespace,
        container: deployment.container,
        image: deployment.image,
        replicas: deployment.replicas || 0,
      }))
    : [];

  const [editImageModal, setEditImageModal] = useState({
    open: false,
    deployment: "",
    container: "",
    currentImage: "",
    newImage: "",
  });

  const [editReplicasModal, setEditReplicasModal] = useState({
    open: false,
    deployment: "",
    currentReplicas: 0,
  });

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];

    if (file) {
      console.group("File Selection Debug");
      console.log("Raw File Object:", file);
      console.log("Filename:", file.name);
      console.log("File Type:", file.type);
      console.log("File Size:", file.size);

      const fileName = file.name.toLowerCase();
      const validExtensions = [".yaml", ".yml"];
      const fileExtension = fileName.substring(fileName.lastIndexOf("."));

      console.log("File Extension:", fileExtension);

      const isValidExtension = validExtensions.includes(fileExtension);

      if (!isValidExtension) {
        console.error("Invalid File Extension");
        toast.error("Please upload a valid YAML file");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        console.log("File Contents:", event.target.result);
      };
      reader.readAsText(file);

      setSelectedFile(file);
      console.groupEnd();
    }
  };

  const handleYAMLUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a YAML file");
      return;
    }

    try {
      console.group("YAML Upload Debugging");

      const response = await uploadDeployment({
        file: selectedFile,
        clusterName: clusterName,
      }).unwrap();

      toast.success("Deployment Uploaded Successfully", {
        description: (
          <div className="space-y-2">
            <p>
              <strong>Cluster:</strong> {clusterName}
            </p>
            {response.details && (
              <>
                <p>
                  <strong>Deployment Name:</strong>{" "}
                  {response.details.deploymentName}
                </p>
                <p>
                  <strong>Resource Kind:</strong> {response.details.kind}
                </p>
              </>
            )}
            {response.kubectlResult && (
              <div className="mt-2 max-h-20 overflow-auto bg-gray-100 p-2 rounded">
                <strong>Kubectl Output:</strong>
                <pre className="text-xs">{response.kubectlResult}</pre>
              </div>
            )}
          </div>
        ),
        autoClose: 7000,
      });

      setSelectedFile(null);

      console.groupEnd();
    } catch (error) {
      console.error("Upload Error:", error);

      toast.error(error.message || "Failed to upload deployment", {
        description: error.details,
        autoClose: false,
      });

      console.groupEnd();
    }
  };
// Add this effect hook near your other state declarations
const fetchImageSuggestions = async (query) => {
  if (!query) {
    setImageSuggestions([]);
    return;
  }

  try {
    setIsLoadingSuggestions(true);
    const response = await fetch(
      `https://hub.docker.com/v2/search/repositories/?query=${encodeURIComponent(query)}`
    );
    const data = await response.json();
    setImageSuggestions(data.results.map(result => result.repo_name));
  } catch (error) {
    console.error('Error fetching image suggestions:', error);
    toast.error('Failed to fetch image suggestions');
  } finally {
    setIsLoadingSuggestions(false);
  }
};
const debounce = (func, delay) => {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
};


  const openImageUpdateModal = (imageDetail) => {
    setEditImageModal({
      open: true,
      deployment: imageDetail.deployment,
      container: imageDetail.container,
      currentImage: imageDetail.image,
      newImage: imageDetail.image,
    });
  };

  const openReplicasUpdateModal = (imageDetail) => {
    setEditReplicasModal({
      open: true,
      deployment: imageDetail.deployment,
      currentReplicas: imageDetail.replicas,
    });
  };

  const handleImageUpdate = async () => {
    try {
      // Use values from editImageModal state
      const result = await updateImage({
        clusterName,  // from props
        deploymentName: editImageModal.deployment,
        containerName: editImageModal.container,
        newImage: editImageModal.newImage,
        namespace: 'default'  // You can make this dynamic if needed
      }).unwrap();
  
  
      // Success handling
      toast.success(result.message || "Image updated successfully");
      
      // Close the modal
      setEditImageModal({
        open: false,
        deployment: "",
        container: "",
        currentImage: "",
        newImage: "",
      });
    } catch (error) {
      // Error handling
      console.error('Image Update Failed:', error);
      
      // Use a more robust error message
      const errorMessage = 
        error.data?.detail || 
        error.message || 
        "Failed to update image";
      
      toast.error(errorMessage);
    }
  };
  const handleDeploymentDeletion = async (deploymentName) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the deployment ${deploymentName}? This action cannot be undone.`
    );
    
    if (!confirmDelete) return;


    try {
      await deleteDeployment({ 
        clusterName, 
        deploymentName 
      }).unwrap();
    } catch (error) {
      console.error('Deletion failed', error);
    }
  };

  const handleReplicasUpdate = async () => {
    try {
      await updateReplicas({
        clusterName: clusterName,
        deploymentName: editReplicasModal.deployment,
        replicas: editReplicasModal.currentReplicas,
      }).unwrap();

      toast.success("Replicas updated successfully");
      setEditReplicasModal({
        open: false,
        deployment: "",
        currentReplicas: 0,
      });
    } catch (error) {
      console.error("Failed to update replicas", error);

      const errorMessage =
        error.data?.detail || error.message || "Failed to update replicas";

      toast.error(errorMessage);
    }
  };
// Create a debounced version of the fetch function
const debouncedFetchSuggestions = debounce(fetchImageSuggestions, 300);
  return (
    
    <div className="bg-white shadow-lg rounded-lg p-6 mt-6">
      <div className="mb-6 flex items-center space-x-4">
        <div className="flex-grow">
          <label
            htmlFor="yaml-upload"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Upload YAML Deployment
          </label>
          <div className="flex items-center">
            <input
              type="file"
              id="yaml-upload"
              accept=".yaml,.yml"
              onChange={handleFileSelect}
              className="flex-grow mr-4 p-2 border rounded"
            />
            <button
              onClick={handleYAMLUpload}
              disabled={!selectedFile}
              className="flex items-center bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
            >
              <Upload className="mr-2" size={20} />
              Add Deployment
            </button>
          </div>
        </div>
      </div>
      <h2 className="text-2xl font-semibold mb-4 flex items-center">
  <Database className="mr-3" /> Images
</h2>
<table className="w-full border-collapse">
  <thead className="bg-gray-100">
    <tr>
      <th className="border p-3 text-left">Namespace</th>
      <th className="border p-3 text-left">Deployment</th>
      <th className="border p-3 text-left">Container</th>
      <th className="border p-3 text-left">Image</th>
      <th className="border p-3 text-left">Replicas</th>
      <th className="border p-3 text-left">Image Actions</th>
      <th className="border p-3 text-left text-nowrap">Deployment Delete</th> {/* New Column */}
    </tr>
  </thead>
  <tbody>
    {parsedImages.length > 0 ? (
      parsedImages.map((imageDetail, index) => (
        <tr key={index} className="hover:bg-gray-50">
          <td className="border p-3">{imageDetail.namespace || "N/A"}</td>
          <td className="border p-3">{imageDetail.deployment || "N/A"}</td>
          <td className="border p-3">{imageDetail.container || "N/A"}</td>
          <td className="border p-3">{imageDetail.image || "N/A"}</td>
          <td className="border p-3">
            {imageDetail.replicas !== undefined ? imageDetail.replicas : "N/A"}
          </td>
          <td className="border p-3 flex space-x-2">
            <button
              onClick={() => openImageUpdateModal(imageDetail)}
              className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 flex items-center"
            >
              <Edit2 size={16} className="mr-1" /> Update Image
            </button>
            <button
              onClick={() => openReplicasUpdateModal(imageDetail)}
              className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 flex items-center"
            >
              <RefreshCw size={16} className="mr-1" /> Update Replicas
            </button>
          </td>
          <td className="border p-3">
            <button
              onClick={() => handleDeploymentDeletion(imageDetail.deployment)}
              className="text-red-500 hover:text-red-700 transition-colors"
              title="Delete Deployment"
            >
              <Trash2 size={20} />
            </button>
          </td>
        </tr>
      ))
    ) : (
      <tr>
        <td colSpan="7" className="text-center py-4 text-gray-500">
          No images found
        </td>
      </tr>
    )}
  </tbody>
</table>

      {/* Image Update Modal */}
     {/* Updated Image Update Modal */}
{editImageModal.open && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
    <div className="bg-white p-6 rounded-lg w-full max-w-2xl mx-4 flex flex-col" style={{ minHeight: '400px' }}>
      <h2 className="text-xl font-semibold mb-4">Update Image</h2>
      
      <div className="flex-grow space-y-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deployment
          </label>
          <input
            type="text"
            value={editImageModal.deployment}
            disabled
            className="w-full p-2 border rounded bg-gray-100"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Container
          </label>
          <input
            type="text"
            value={editImageModal.container}
            disabled
            className="w-full p-2 border rounded bg-gray-100"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Image
          </label>
          <input
            type="text"
            value={editImageModal.currentImage}
            disabled
            className="w-full p-2 border rounded bg-gray-100"
          />
        </div>

        <div className="mb-4 relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            New Image
          </label>
          <div className="relative">
            <input
              type="text"
              value={editImageModal.newImage}
              onChange={(e) => {
                setEditImageModal((prev) => ({
                  ...prev,
                  newImage: e.target.value,
                }));
                debouncedFetchSuggestions(e.target.value);
              }}
              className="w-full p-2 border rounded"
              placeholder="Enter new image"
            />
            {editImageModal.newImage && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {isLoadingSuggestions ? (
                  <div className="p-2 text-gray-500 text-sm">Loading suggestions...</div>
                ) : imageSuggestions.length > 0 ? (
                  imageSuggestions.slice(0, 10).map((suggestion, index) => (
                    <div
                      key={index}
                      className="p-2 hover:bg-gray-100 cursor-pointer truncate text-sm"
                      onClick={() => {
                        setEditImageModal((prev) => ({
                          ...prev,
                          newImage: suggestion,
                        }));
                        setImageSuggestions([]);
                      }}
                      title={suggestion}
                    >
                      {suggestion}
                    </div>
                  ))
                ) : (
                  <div className="p-2 text-gray-500 text-sm"></div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t flex justify-end space-x-2">
        <button
          onClick={() => setEditImageModal({ open: false, deployment: "", container: "", currentImage: "", newImage: "" })}
          className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
        <button
          onClick={handleImageUpdate}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Update
        </button>
      </div>
    </div>
  </div>
)}
      {/* Replicas Update Modal */}
      {editReplicasModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Update Replicas</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deployment
              </label>
              <input
                type="text"
                value={editReplicasModal.deployment}
                disabled
                className="w-full p-2 border rounded bg-gray-100"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Replicas
              </label>
              <input
                type="number"
                value={editReplicasModal.currentReplicas}
                onChange={(e) =>
                  setEditReplicasModal((prev) => ({
                    ...prev,
                    currentReplicas: parseInt(e.target.value),
                  }))
                }
                className="w-full p-2 border rounded"
                placeholder="Enter number of replicas"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() =>
                  setEditReplicasModal({
                    open: false,
                    deployment: "",
                    currentReplicas: 0,
                  })
                }
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleReplicasUpdate}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}