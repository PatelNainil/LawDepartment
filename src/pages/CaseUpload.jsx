import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useFile } from '../context/FileContext';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';

const CaseUpload = () => {
  const { user, hasPermission, logAuditEntry } = useAuth();
  const { addFile } = useFile();
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState([]);
  const [metadata, setMetadata] = useState({
    title: '',
    court: '',
    case_no: '',
    tags: '',
    status: 'active'
  });
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);

  if (!hasPermission('officer')) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to upload case files.</p>
        </div>
      </div>
    );
  }

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFiles = (newFiles) => {
    const validFiles = newFiles.filter(file => {
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
      return validTypes.includes(file.type) && file.size <= 10 * 1024 * 1024; // 10MB limit
    });

    setFiles(prev => [...prev, ...validFiles.map(file => ({
      file,
      id: Date.now() + Math.random(),
      progress: 0,
      status: 'pending'
    }))]);
  };

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const extractTextFromFile = async (file) => {
    // Simulate text extraction (in real app, this would be done on backend)
    return `Extracted text from ${file.name}. This is a sample legal document content that would be indexed for search and AI assistance.`;
  };

  const handleUpload = async () => {
    if (files.length === 0 || !metadata.title) return;

    setUploading(true);
    setUploadStatus(null);

    try {
      const cases = JSON.parse(localStorage.getItem('cases') || '[]');
      const caseIndex = JSON.parse(localStorage.getItem('caseIndex') || '[]');
      
      for (const fileObj of files) {
        // Simulate file upload progress
        for (let progress = 0; progress <= 100; progress += 20) {
          setFiles(prev => prev.map(f => 
            f.id === fileObj.id ? { ...f, progress } : f
          ));
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Extract text and create case entry
        const extractedText = await extractTextFromFile(fileObj.file);
        
        const newCase = {
          id: Date.now() + Math.random(),
          title: metadata.title,
          file_path: `/uploads/${fileObj.file.name}`,
          uploaded_by: user.id,
          uploaded_at: new Date().toISOString(),
          status: metadata.status,
          metadata: {
            court: metadata.court,
            case_no: metadata.case_no,
            tags: metadata.tags.split(',').map(tag => tag.trim()).filter(Boolean),
            file_size: fileObj.file.size,
            file_type: fileObj.file.type
          },
          extracted_text: extractedText
        };

        // Store the actual file object and wait for it to complete
        await addFile(newCase.id, fileObj.file);

        cases.unshift(newCase);

        // Create searchable chunks
        const chunks = extractedText.match(/.{1,500}/g) || [extractedText];
        
        chunks.forEach((chunk, index) => {
          caseIndex.push({
            id: Date.now() + Math.random() + index,
            case_file_id: newCase.id,
            content_chunk: chunk,
            chunk_order: index,
            embedding_vector: [] // In real app, this would be computed
          });
        });
        
        setFiles(prev => prev.map(f => 
          f.id === fileObj.id ? { ...f, status: 'completed' } : f
        ));
      }

      localStorage.setItem('cases', JSON.stringify(cases));
      localStorage.setItem('caseIndex', JSON.stringify(caseIndex));
      
      // Log audit entry
      logAuditEntry(user.id, 'upload', `Uploaded case: ${metadata.title}`, '127.0.0.1');
      
      setUploadStatus('success');
      
      // Reset form
      setTimeout(() => {
        setFiles([]);
        setMetadata({
          title: '',
          court: '',
          case_no: '',
          tags: '',
          status: 'active'
        });
        setUploadStatus(null);
      }, 2000);

    } catch (error) {
      console.error('Upload failed:', error);
      setUploadStatus('error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Upload Case Files</h1>

        {/* File Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
            dragActive
              ? 'border-government-500 bg-government-50'
              : 'border-gray-300 hover:border-government-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            Drop files here or click to browse
          </p>
          <p className="text-sm text-gray-600 mb-4">
            Supported formats: PDF, DOC, DOCX, TXT (Max 10MB each)
          </p>
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt"
            onChange={(e) => handleFiles(Array.from(e.target.files))}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-government-600 hover:bg-government-700 cursor-pointer transition-colors duration-200"
          >
            Choose Files
          </label>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="font-medium text-gray-900">Selected Files</h3>
            {files.map((fileObj) => (
              <div key={fileObj.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">{fileObj.file.name}</p>
                    <p className="text-sm text-gray-600">
                      {(fileObj.file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {fileObj.status === 'completed' && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {fileObj.progress > 0 && fileObj.status !== 'completed' && (
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-government-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${fileObj.progress}%` }}
                      ></div>
                    </div>
                  )}
                  <button
                    onClick={() => removeFile(fileObj.id)}
                    className="text-red-500 hover:text-red-700"
                    disabled={uploading}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Metadata Form */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Case Title *
            </label>
            <input
              type="text"
              required
              value={metadata.title}
              onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-government-500 focus:border-government-500"
              placeholder="Enter case title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Court
            </label>
            <input
              type="text"
              value={metadata.court}
              onChange={(e) => setMetadata(prev => ({ ...prev, court: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-government-500 focus:border-government-500"
              placeholder="e.g., Supreme Court of India"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Case Number
            </label>
            <input
              type="text"
              value={metadata.case_no}
              onChange={(e) => setMetadata(prev => ({ ...prev, case_no: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-government-500 focus:border-government-500"
              placeholder="e.g., CRL.A. 123/2025"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={metadata.status}
              onChange={(e) => setMetadata(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-government-500 focus:border-government-500"
            >
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={metadata.tags}
              onChange={(e) => setMetadata(prev => ({ ...prev, tags: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-government-500 focus:border-government-500"
              placeholder="e.g., criminal, appeal, civil rights"
            />
          </div>
        </div>

        {/* Upload Status */}
        {uploadStatus && (
          <div className={`mt-6 p-4 rounded-lg ${
            uploadStatus === 'success' 
              ? 'bg-green-50 text-green-800' 
              : 'bg-red-50 text-red-800'
          }`}>
            <div className="flex items-center space-x-2">
              {uploadStatus === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="font-medium">
                {uploadStatus === 'success' 
                  ? 'Files uploaded successfully!' 
                  : 'Upload failed. Please try again.'}
              </span>
            </div>
          </div>
        )}

        {/* Upload Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleUpload}
            disabled={files.length === 0 || !metadata.title || uploading}
            className="px-6 py-3 bg-government-600 text-white font-medium rounded-md hover:bg-government-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-government-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {uploading ? 'Uploading...' : 'Upload Cases'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CaseUpload;
