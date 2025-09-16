import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Search as SearchIcon, 
  Bot, 
  FileText, 
  Send,
  AlertCircle,
  Clock,
  MessageSquare,
  ExternalLink
} from 'lucide-react';

const Search = () => {
  const { user, hasPermission, logAuditEntry } = useAuth();
  const [activeTab, setActiveTab] = useState('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    // Load chat history from localStorage
    const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    setChatHistory(history);
  }, []);

  useEffect(() => {
    // Check if we should start with AI tab (from URL params)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('tab') === 'ai') {
      setActiveTab('ai');
    }
  }, []);

  if (!hasPermission('staff')) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access search functionality.</p>
        </div>
      </div>
    );
  }

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    
    try {
      // Search through case index
      const caseIndex = JSON.parse(localStorage.getItem('caseIndex') || '[]');
      const cases = JSON.parse(localStorage.getItem('cases') || '[]');
      
      const results = caseIndex.filter(chunk =>
        chunk.content_chunk.toLowerCase().includes(searchQuery.toLowerCase())
      ).map(chunk => {
        const case_ = cases.find(c => c.id === chunk.case_file_id);
        return {
          ...chunk,
          case_title: case_?.title || 'Unknown Case',
          case_id: case_?.id
        };
      });

      setSearchResults(results);
      
      // Log search action
      logAuditEntry(user.id, 'search', `Searched for: ${searchQuery}`, '127.0.0.1');
      
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAIQuery = async (e) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;

    setAiLoading(true);
    
    try {
      // Simulate AI processing with retrieval from case files
      const caseIndex = JSON.parse(localStorage.getItem('caseIndex') || '[]');
      const cases = JSON.parse(localStorage.getItem('cases') || '[]');
      
      // Find relevant chunks (simple keyword matching for demo)
      const relevantChunks = caseIndex.filter(chunk =>
        aiQuery.toLowerCase().split(' ').some(word => 
          chunk.content_chunk.toLowerCase().includes(word)
        )
      ).slice(0, 3); // Top 3 relevant chunks

      let response;
      if (relevantChunks.length === 0) {
        response = "I couldn't find relevant information in the stored case files. Please upload relevant documents or try a different query.";
      } else {
        // Simulate AI response based on retrieved content
        const sourceCases = relevantChunks.map(chunk => {
          const case_ = cases.find(c => c.id === chunk.case_file_id);
          return case_?.title || 'Unknown Case';
        });
        
        response = `Based on the case files I found, here's what I can tell you about "${aiQuery}":

${relevantChunks[0].content_chunk.substring(0, 300)}...

**Sources:**
${sourceCases.map((title, index) => `- ${title} (Chunk ${relevantChunks[index].chunk_order + 1})`).join('\n')}

This information is derived from your uploaded case documents. For more detailed analysis, please refer to the complete case files.`;
      }

      setAiResponse(response);
      
      // Add to chat history
      const newChatEntry = {
        id: Date.now(),
        query: aiQuery,
        response: response,
        timestamp: new Date().toISOString(),
        case_file_ids: relevantChunks.map(chunk => chunk.case_file_id)
      };
      
      const updatedHistory = [newChatEntry, ...chatHistory].slice(0, 50); // Keep last 50 entries
      setChatHistory(updatedHistory);
      localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
      
      // Log AI query
      logAuditEntry(user.id, 'ai_query', `AI Query: ${aiQuery}`, '127.0.0.1');
      
      setAiQuery('');
      
    } catch (error) {
      console.error('AI query failed:', error);
      setAiResponse('Sorry, there was an error processing your query. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('search')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'search'
                  ? 'border-government-500 text-government-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <SearchIcon className="w-5 h-5 inline mr-2" />
              Search Cases
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'ai'
                  ? 'border-government-500 text-government-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Bot className="w-5 h-5 inline mr-2" />
              AI Assistant
            </button>
          </nav>
        </div>

        {/* Search Tab */}
        {activeTab === 'search' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Case Files</h2>
            
            <form onSubmit={handleSearch} className="mb-6">
              <div className="flex space-x-4">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search through case content..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-government-500 focus:border-government-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searchLoading || !searchQuery.trim()}
                  className="px-6 py-3 bg-government-600 text-white font-medium rounded-md hover:bg-government-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-government-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {searchLoading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </form>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Search Results ({searchResults.length})
                </h3>
                {searchResults.map((result) => (
                  <div key={result.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-government-600">{result.case_title}</h4>
                      <span className="text-xs text-gray-500">Chunk {result.chunk_order + 1}</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">
                      {result.content_chunk.substring(0, 200)}...
                    </p>
                    <a
                      href={`/cases/${result.case_id}`}
                      className="inline-flex items-center text-sm text-government-600 hover:text-government-700"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      View Full Case
                    </a>
                  </div>
                ))}
              </div>
            )}

            {searchQuery && searchResults.length === 0 && !searchLoading && (
              <div className="text-center py-8">
                <SearchIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
                <p className="text-gray-600">No case content matches your search query.</p>
              </div>
            )}
          </div>
        )}

        {/* AI Assistant Tab */}
        {activeTab === 'ai' && (
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">AI Legal Assistant</h2>
            <p className="text-gray-600 mb-6">
              Ask questions about your case files. The AI will only use information from uploaded documents.
            </p>

            {/* AI Query Form */}
            <form onSubmit={handleAIQuery} className="mb-6">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <textarea
                    placeholder="Ask a question about your case files..."
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    rows={3}
                    className="block w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-government-500 focus:border-government-500 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={aiLoading || !aiQuery.trim()}
                  className="px-6 py-3 bg-government-600 text-white font-medium rounded-md hover:bg-government-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-government-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {aiLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Ask AI
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* AI Response */}
            {aiResponse && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">AI Response:</h4>
                <div className="text-blue-800 whitespace-pre-wrap">{aiResponse}</div>
              </div>
            )}

            {/* Chat History */}
            {chatHistory.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Recent Queries
                </h3>
                {chatHistory.slice(0, 5).map((chat) => (
                  <div key={chat.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-medium text-gray-900">Q: {chat.query}</h5>
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(chat.timestamp).toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                      {chat.response.substring(0, 200)}
                      {chat.response.length > 200 && '...'}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {chatHistory.length === 0 && (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Queries Yet</h3>
                <p className="text-gray-600">Start by asking a question about your case files.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
