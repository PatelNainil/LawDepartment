import React, { createContext, useContext } from 'react';

const FileContext = createContext();

export const useFile = () => {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error('useFile must be used within a FileProvider');
  }
  return context;
};

// Helper to convert data URL to Blob
function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) {
      // Handle cases where the data URL might be malformed
      return new Blob();
    }
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
}


export const FileProvider = ({ children }) => {
  const fileStoreKey = 'lawPortalFileStore';

  const addFile = (caseId, file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const storedFiles = JSON.parse(localStorage.getItem(fileStoreKey) || '{}');
          storedFiles[caseId] = {
            dataUrl: event.target.result,
            name: file.name,
            type: file.type,
          };
          localStorage.setItem(fileStoreKey, JSON.stringify(storedFiles));
          resolve();
        } catch (error) {
          console.error("Could not save file to local storage. It might be full.", error);
          alert("Could not save file to local storage. It might be full. Please clear some space and try again.");
          reject(error);
        }
      };

      reader.onerror = (error) => {
        console.error("Error reading file:", error);
        alert("An error occurred while trying to read the file for storage.");
        reject(error);
      };
      
      reader.readAsDataURL(file);
    });
  };

  const getFile = (caseId) => {
    try {
      const storedFiles = JSON.parse(localStorage.getItem(fileStoreKey) || '{}');
      const fileData = storedFiles[caseId];
      if (fileData && fileData.dataUrl) {
        const blob = dataURLtoBlob(fileData.dataUrl);
        return { blob, name: fileData.name, type: fileData.type };
      }
    } catch (error) {
      console.error("Could not retrieve file from local storage.", error);
    }
    return null;
  };

  const value = {
    addFile,
    getFile,
  };

  return (
    <FileContext.Provider value={value}>
      {children}
    </FileContext.Provider>
  );
};
