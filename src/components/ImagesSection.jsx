import React, { useState } from "react";
import {
  useUploadDeploymentMutation,
  useUpdateImageMutation,
  useUpdateReplicasMutation,
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
} from "lucide-react";
import axios from "axios";

export function ImagesSection({ clusterDetails, clusterName }) {
  /** @type {[File | null, function]} */
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadDeployment] = useUploadDeploymentMutation();
  const [updateImage] = useUpdateImageMutation();
  const [updateReplicas] = useUpdateReplicasMutation();

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
      await updateImage({
        clusterName: clusterName,
        deploymentName: editImageModal.deployment,
        containerName: editImageModal.container,
        newImage: editImageModal.newImage,
      }).unwrap();

      toast.success("Image updated successfully");
      setEditImageModal({
        open: false,
        deployment: "",
        container: "",
        currentImage: "",
        newImage: "",
      });
    } catch (error) {
      console.error("Failed to update image", error);
      toast.error("Failed to update image");
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

      {/* Images Table */}
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
            <th className="border p-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {parsedImages.length > 0 ? (
            parsedImages.map((imageDetail, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border p-3">{imageDetail.namespace || "N/A"}</td>
                <td className="border p-3">
                  {imageDetail.deployment || "N/A"}
                </td>
                <td className="border p-3">{imageDetail.container || "N/A"}</td>
                <td className="border p-3">{imageDetail.image || "N/A"}</td>
                <td className="border p-3">
                  {imageDetail.replicas !== undefined
                    ? imageDetail.replicas
                    : "N/A"}
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
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" className="text-center py-4 text-gray-500">
                No images found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Image Update Modal */}
      {editImageModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Update Image</h2>
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
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Image
              </label>
              <input
                type="text"
                value={editImageModal.newImage}
                onChange={(e) =>
                  setEditImageModal((prev) => ({
                    ...prev,
                    newImage: e.target.value,
                  }))
                }
                className="w-full p-2 border rounded"
                placeholder="Enter new image"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() =>
                  setEditImageModal({
                    open: false,
                    deployment: "",
                    container: "",
                    currentImage: "",
                    newImage: "",
                  })
                }
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
