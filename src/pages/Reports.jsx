import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  FileText, 
  Users,
  Activity,
  Clock,
  AlertCircle,
  Plus,
  Filter
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Reports = () => {
  const { user, hasPermission, employees, logAuditEntry } = useAuth();
  const [reportType, setReportType] = useState('activity');
  const [dateRange, setDateRange] = useState('month');
  const [selectedEmployee, setSelectedEmployee] = useState('all');
  const [reports, setReports] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load saved reports from localStorage
    const savedReports = JSON.parse(localStorage.getItem('reports') || '[]');
    setReports(savedReports);
  }, []);

  useEffect(() => {
    if (hasPermission('officer')) {
      generateReportData();
    }
  }, [reportType, dateRange, selectedEmployee, hasPermission]);

  if (!hasPermission('officer')) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to generate reports.</p>
        </div>
      </div>
    );
  }

  const generateReportData = () => {
    const auditLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
    const cases = JSON.parse(localStorage.getItem('cases') || '[]');
    const chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');

    const now = new Date();
    let startDate = new Date();

    switch (dateRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const filteredLogs = auditLogs.filter(log => {
      const logDate = new Date(log.timestamp);
      const matchesDate = logDate >= startDate;
      const matchesEmployee = selectedEmployee === 'all' || log.employee_id.toString() === selectedEmployee;
      return matchesDate && matchesEmployee;
    });

    switch (reportType) {
      case 'activity':
        generateActivityReport(filteredLogs);
        break;
      case 'usage':
        generateUsageReport(filteredLogs, cases, chatHistory);
        break;
      case 'case-status':
        generateCaseStatusReport(cases);
        break;
      case 'ai-queries':
        generateAIQueriesReport(chatHistory, startDate);
        break;
    }
  };

  const generateActivityReport = (logs) => {
    const actionCounts = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {});

    const chartData = Object.entries(actionCounts).map(([action, count]) => ({
      action: action.replace('_', ' ').toUpperCase(),
      count
    }));

    setReportData({
      type: 'activity',
      title: 'System Activity Report',
      chartData,
      summary: {
        totalActions: logs.length,
        uniqueUsers: new Set(logs.map(log => log.employee_id)).size,
        mostActiveAction: Object.keys(actionCounts).reduce((a, b) => 
          actionCounts[a] > actionCounts[b] ? a : b, Object.keys(actionCounts)[0]
        )
      }
    });
  };

  const generateUsageReport = (logs, cases, chatHistory) => {
    const userActivity = employees.map(emp => {
      const userLogs = logs.filter(log => log.employee_id === emp.id);
      const userCases = cases.filter(case_ => case_.uploaded_by === emp.id);
      const userQueries = chatHistory.filter(chat => 
        logs.some(log => log.employee_id === emp.id && log.action === 'ai_query')
      );

      return {
        name: emp.name,
        activities: userLogs.length,
        cases: userCases.length,
        queries: userQueries.length
      };
    });

    setReportData({
      type: 'usage',
      title: 'User Usage Report',
      chartData: userActivity,
      summary: {
        totalUsers: employees.length,
        activeUsers: userActivity.filter(user => user.activities > 0).length,
        totalCases: cases.length,
        totalQueries: chatHistory.length
      }
    });
  };

  const generateCaseStatusReport = (cases) => {
    const statusCounts = cases.reduce((acc, case_) => {
      acc[case_.status] = (acc[case_.status] || 0) + 1;
      return acc;
    }, {});

    const pieData = Object.entries(statusCounts).map(([status, count]) => ({
      name: status.toUpperCase(),
      value: count
    }));

    setReportData({
      type: 'case-status',
      title: 'Case Status Report',
      pieData,
      summary: {
        totalCases: cases.length,
        activeCases: statusCounts.active || 0,
        closedCases: statusCounts.closed || 0
      }
    });
  };

  const generateAIQueriesReport = (chatHistory, startDate) => {
    const filteredQueries = chatHistory.filter(chat => 
      new Date(chat.timestamp) >= startDate
    );

    const dailyQueries = filteredQueries.reduce((acc, chat) => {
      const date = new Date(chat.timestamp).toLocaleDateString('en-IN');
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const chartData = Object.entries(dailyQueries).map(([date, count]) => ({
      date,
      queries: count
    }));

    setReportData({
      type: 'ai-queries',
      title: 'AI Queries Report',
      chartData,
      summary: {
        totalQueries: filteredQueries.length,
        avgPerDay: (filteredQueries.length / Math.max(1, Object.keys(dailyQueries).length)).toFixed(1),
        peakDay: Object.keys(dailyQueries).reduce((a, b) => 
          dailyQueries[a] > dailyQueries[b] ? a : b, Object.keys(dailyQueries)[0]
        )
      }
    });
  };

  const generateReport = async () => {
    setLoading(true);
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newReport = {
      id: Date.now(),
      generated_by: user.id,
      report_type: reportType,
      filters: {
        dateRange,
        selectedEmployee,
        generatedAt: new Date().toISOString()
      },
      file_path: `/reports/report_${Date.now()}.pdf`,
      generated_at: new Date().toISOString(),
      scheduled: false
    };

    const updatedReports = [newReport, ...reports].slice(0, 50);
    setReports(updatedReports);
    localStorage.setItem('reports', JSON.stringify(updatedReports));
    
    setLoading(false);
  };

  const handleDownloadReport = (report) => {
    // Simulate downloading the report by generating a sample CSV
    let csvContent = `Report Type: ${report.report_type}\n`;
    csvContent += `Generated On: ${new Date(report.generated_at).toLocaleString('en-IN')}\n\n`;

    switch (report.report_type) {
      case 'activity':
        csvContent += 'Action,Count\nLogin,15\nUpload,5\nSearch,30\n';
        break;
      case 'usage':
        csvContent += 'User,Activities\nPriya Sharma,50\nRajesh Kumar,40\n';
        break;
      case 'case-status':
        csvContent += 'Status,Count\nActive,100\nClosed,50\n';
        break;
      case 'ai-queries':
        csvContent += 'Date,Queries\n01/01/2025,10\n02/01/2025,15\n';
        break;
      default:
        csvContent += 'No data available for this report type.';
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `report_${report.id}.csv`;
    document.body.appendChild(a);
    a.click();
    
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    logAuditEntry(user.id, 'download', `Downloaded report: ${report.report_type}`, '127.0.0.1');
  };

  const COLORS = ['#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="w-6 h-6 mr-2" />
              Reports & Analytics
            </h1>
            <p className="text-gray-600 mt-1">
              Generate and view system reports
            </p>
          </div>
        </div>

        {/* Report Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-government-500 focus:border-government-500"
            >
              <option value="activity">System Activity</option>
              <option value="usage">User Usage</option>
              <option value="case-status">Case Status</option>
              <option value="ai-queries">AI Queries</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-government-500 focus:border-government-500"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-government-500 focus:border-government-500"
            >
              <option value="all">All Employees</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={generateReport}
              disabled={loading}
              className="w-full px-4 py-2 bg-government-600 text-white font-medium rounded-md hover:bg-government-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-government-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>

        {/* Report Visualization */}
        {reportData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Summary Cards */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Summary</h3>
              
              {reportData.type === 'activity' && (
                <>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Activity className="w-8 h-8 text-blue-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-blue-900">Total Actions</p>
                        <p className="text-2xl font-bold text-blue-600">{reportData.summary.totalActions}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <Users className="w-8 h-8 text-green-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-900">Active Users</p>
                        <p className="text-2xl font-bold text-green-600">{reportData.summary.uniqueUsers}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {reportData.type === 'case-status' && (
                <>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <FileText className="w-8 h-8 text-green-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-green-900">Active Cases</p>
                        <p className="text-2xl font-bold text-green-600">{reportData.summary.activeCases}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <FileText className="w-8 h-8 text-gray-600" />
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Closed Cases</p>
                        <p className="text-2xl font-bold text-gray-600">{reportData.summary.closedCases}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Chart */}
            <div className="lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{reportData.title}</h3>
              
              {reportData.chartData && (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={reportData.chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={reportData.type === 'ai-queries' ? 'date' : (reportData.type === 'usage' ? 'name' : 'action')} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey={reportData.type === 'ai-queries' ? 'queries' : (reportData.type === 'usage' ? 'activities' : 'count')} fill="#1e3a8a" />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {reportData.pieData && (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={reportData.pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {reportData.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {/* Generated Reports History */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Generated Reports</h3>
          
          {reports.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Reports Generated</h4>
              <p className="text-gray-600">Generate your first report using the options above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.slice(0, 10).map((report) => (
                <div key={report.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 capitalize">
                      {report.report_type.replace('-', ' ')} Report
                    </h4>
                    <p className="text-sm text-gray-600">
                      Generated on {new Date(report.generated_at).toLocaleString('en-IN')}
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => handleDownloadReport(report)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
