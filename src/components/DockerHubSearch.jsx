// DockerHubSearch.js
import React, { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';


const DockerHubSearch = ({ onSelectImage }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);


  const searchDockerHubImages = useCallback(
    debounce(async (query) => {
      if (!query) {
        setImages([]);
        return;
      }


      setLoading(true);
      try {
        const response = await fetch(`https://hub.docker.com/v2/search/repositories/?query=${query}`);
        const data = await response.json();
        
        setImages(
          data.results?.map(repo => ({
            name: repo.name,
            description: repo.description,
          })) || []
        );
      } catch (error) {
        console.error('Search failed:', error);
        setImages([]);
      } finally {
        setLoading(false);
      }
    }, 500),
    []
  );


  useEffect(() => {
    searchDockerHubImages(searchTerm);
  }, [searchTerm, searchDockerHubImages]);


  return (
    <div className="absolute z-10 bg-white border rounded mt-1 w-full shadow-lg">
      <input 
        className="w-full p-2 border rounded mb-4"
        placeholder="Search Docker Hub images" 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />


      {loading && <p className="text-center text-gray-500">Searching...</p>}


      {images.length > 0 && (
        <div className="space-y-2">
          {images.map((image, index) => (
            <div 
              key={index} 
              className="border p-2 rounded cursor-pointer hover:bg-gray-100"
              onClick={() => onSelectImage(image.name)}
            >
              <span>{image.name}</span>
              <p className="text-gray-500">{image.description}</p>
            </div>
          ))}
        </div>
      )}


      {images.length === 0 && !loading && searchTerm && (
        <p className="text-center text-gray-500">No images found</p>
      )}
    </div>
  );
};


export default DockerHubSearch;