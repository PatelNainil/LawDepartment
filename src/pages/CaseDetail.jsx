import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFile } from '../context/FileContext';
import { 
  FileText, 
  Calendar, 
  User, 
  Tag, 
  Download, 
  Edit, 
  ArrowLeft,
  AlertCircle,
  Clock,
  Building
} from 'lucide-react';

const CaseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasPermission, logAuditEntry } = useAuth();
  const { getFile } = useFile();
  const [case_, setCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    // Load case from localStorage
    const cases = JSON.parse(localStorage.getItem('cases') || '[]');
    const foundCase = cases.find(c => c.id.toString() === id);
    
    if (foundCase) {
      setCase(foundCase);
      setEditForm({
        title: foundCase.title,
        status: foundCase.status,
        court: foundCase.metadata?.court || '',
        case_no: foundCase.metadata?.case_no || '',
        tags: foundCase.metadata?.tags?.join(', ') || ''
      });
    }
    setLoading(false);
  }, [id]);

  if (!hasPermission('staff')) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to view case details.</p>
        </div>
      </div>
    );
  }

  const handleSave = () => {
    if (!hasPermission('officer')) return;

    const cases = JSON.parse(localStorage.getItem('cases') || '[]');
    const updatedCases = cases.map(c => {
      if (c.id.toString() === id) {
        return {
          ...c,
          title: editForm.title,
          status: editForm.status,
          metadata: {
            ...c.metadata,
            court: editForm.court,
            case_no: editForm.case_no,
            tags: editForm.tags.split(',').map(tag => tag.trim()).filter(Boolean)
          }
        };
      }
      return c;
    });

    localStorage.setItem('cases', JSON.stringify(updatedCases));
    setCase(updatedCases.find(c => c.id.toString() === id));
    setEditing(false);
  };

  const handleDownload = () => {
    if (!case_) return;

    const fileData = getFile(case_.id);

    let blob;
    let fileName;

    if (fileData) {
      // File found in persistent store
      blob = fileData.blob;
      fileName = fileData.name;
    } else {
      // Fallback for pre-populated data or files from a cleared cache
      const samplePdfBase64 = 'JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCjIgMCBvYmoKPDwKL1R5cGUgL1BhZ2VzCi9LaWRzIFszIDAgUiBdCi9Db3VudCAxCi9NZWRpYUJveCBbMCAwIDU5NSA4NDJdCj4+CmVuZG9iagozIDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9QYXJlbnQgMiAwIFIKL1JvdGF0ZSAwCi9SZXNvdXJjZXMgPDwKL0ZvbnQgPDwKL0YxIDQgMCBSCj4+Cj4+Ci9Db250ZW50cyA1IDAgUgo+PgplbmRvYmoKNSAwIG9iago8PAovTGVuZ3RoIDYyCj4+CnN0cmVhbQpCVCAvRjEgMTIgVGYgNzIgNzgwIFRkIChTYW1wbGUgQ2FzZSBGaWxlKSBUaiBFVAplbmRzdHJlYW0KZW5kb2JqCjQgMCBvYmoKPDwKL1R5cGUgL0ZvbnQKL1N1YnR5cGUgL1R5cGUxCi9CYXNlRm9udCAvSGVsdmV0aWNhCi9FbmNvZGluZyAvV2luQW5zaUVuY29kaW5nCj4+CmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1OSAwMDAwMCBuIAowMDAwMDAwMTM0IDAwMDAwIG4gCjAwMDAwMDAzNTMgMDAwMDAgbiAKMDAwMDAwMDI1OCAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDYKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjQ1MAolJUVPRgo=';
      const byteCharacters = atob(samplePdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      blob = new Blob([byteArray], { type: 'application/pdf' });
      fileName = case_.file_path.split('/').pop() || `${case_.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    logAuditEntry(user.id, 'download', `Downloaded case file: ${case_.title}`, '127.0.0.1');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-government-600"></div>
      </div>
    );
  }

  if (!case_) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Case Not Found</h2>
          <p className="text-gray-600 mb-4">The requested case could not be found.</p>
          <Link
            to="/cases"
            className="inline-flex items-center px-4 py-2 bg-government-600 text-white font-medium rounded-md hover:bg-government-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cases
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/cases')}
          className="inline-flex items-center text-government-600 hover:text-government-700 font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Cases
        </button>
        
        {hasPermission('officer') && (
          <div className="flex space-x-3">
            {editing ? (
              <>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-government-600 text-white font-medium rounded-md hover:bg-government-700"
                >
                  Save Changes
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center px-4 py-2 bg-government-600 text-white font-medium rounded-md hover:bg-government-700"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Case
              </button>
            )}
          </div>
        )}
      </div>

      {/* Case Details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between mb-4">
            {editing ? (
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                className="text-2xl font-bold text-gray-900 border-b-2 border-government-500 bg-transparent focus:outline-none flex-1 mr-4"
              />
            ) : (
              <h1 className="text-2xl font-bold text-gray-900">{case_.title}</h1>
            )}
            
            {editing ? (
              <select
                value={editForm.status}
                onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="active">Active</option>
                <option value="closed">Closed</option>
              </select>
            ) : (
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(case_.status)}`}>
                {case_.status}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Case Number</p>
                {editing ? (
                  <input
                    type="text"
                    value={editForm.case_no}
                    onChange={(e) => setEditForm(prev => ({ ...prev, case_no: e.target.value }))}
                    className="font-medium text-gray-900 border-b border-gray-300 bg-transparent focus:outline-none"
                    placeholder="Enter case number"
                  />
                ) : (
                  <p className="font-medium text-gray-900">{case_.metadata?.case_no || 'Not specified'}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Building className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Court</p>
                {editing ? (
                  <input
                    type="text"
                    value={editForm.court}
                    onChange={(e) => setEditForm(prev => ({ ...prev, court: e.target.value }))}
                    className="font-medium text-gray-900 border-b border-gray-300 bg-transparent focus:outline-none"
                    placeholder="Enter court name"
                  />
                ) : (
                  <p className="font-medium text-gray-900">{case_.metadata?.court || 'Not specified'}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Uploaded</p>
                <p className="font-medium text-gray-900">
                  {new Date(case_.uploaded_at).toLocaleDateString('en-IN')}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Uploaded By</p>
                <p className="font-medium text-gray-900">
                  {case_.uploaded_by === user?.id ? 'You' : 'Another Officer'}
                </p>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="mt-6">
            <div className="flex items-center space-x-2 mb-2">
              <Tag className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600">Tags</span>
            </div>
            {editing ? (
              <input
                type="text"
                value={editForm.tags}
                onChange={(e) => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-government-500"
                placeholder="Enter tags separated by commas"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {case_.metadata?.tags && case_.metadata.tags.length > 0 ? (
                  case_.metadata.tags.map((tag, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm">No tags</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* File Information */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">File Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600">Original File Path</p>
              <p className="font-medium text-gray-900">{case_.file_path}</p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Original File Size</p>
              <p className="font-medium text-gray-900">
                {case_.metadata?.file_size 
                  ? `${(case_.metadata.file_size / (1024 * 1024)).toFixed(2)} MB`
                  : 'Unknown'}
              </p>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Original File Type</p>
              <p className="font-medium text-gray-900">
                {case_.metadata?.file_type || 'Unknown'}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <button 
              onClick={handleDownload}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors duration-200"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Original File
            </button>
          </div>
        </div>

        {/* Extracted Text Preview */}
        {case_.extracted_text && (
          <div className="p-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Preview</h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {case_.extracted_text.substring(0, 1000)}
                {case_.extracted_text.length > 1000 && '...'}
              </p>
            </div>
            {case_.extracted_text.length > 1000 && (
              <p className="text-sm text-gray-500 mt-2">
                Showing first 1000 characters. Full text is available for search and AI assistance.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseDetail;
