import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Upload, 
  Search, 
  FileText, 
  BarChart3, 
  Shield, 
  Bot,
  TrendingUp,
  Clock,
  Users,
  AlertTriangle
} from 'lucide-react';

const Dashboard = () => {
  const { user, hasPermission } = useAuth();
  const [stats, setStats] = useState({
    totalCases: 0,
    activeCases: 0,
    thisMonthUploads: 0,
    aiQueries: 0
  });

  useEffect(() => {
    // Load dashboard stats from localStorage
    const cases = JSON.parse(localStorage.getItem('cases') || '[]');
    const auditLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
    const thisMonth = new Date().getMonth();
    
    setStats({
      totalCases: cases.length,
      activeCases: cases.filter(c => c.status === 'active').length,
      thisMonthUploads: cases.filter(c => new Date(c.uploaded_at).getMonth() === thisMonth).length,
      aiQueries: auditLogs.filter(log => log.action === 'ai_query').length
    });
  }, []);

  const quickActions = [
    {
      name: 'Upload Case',
      icon: Upload,
      href: '/upload',
      description: 'Upload new case files',
      permission: 'officer',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      name: 'Search Cases',
      icon: Search,
      href: '/search',
      description: 'Search & AI Assistant',
      permission: 'staff',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      name: 'View Cases',
      icon: FileText,
      href: '/cases',
      description: 'Browse all cases',
      permission: 'staff',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      name: 'Reports',
      icon: BarChart3,
      href: '/reports',
      description: 'Generate reports',
      permission: 'officer',
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      name: 'Audit Logs',
      icon: Shield,
      href: '/audit',
      description: 'View system logs',
      permission: 'admin',
      color: 'bg-red-500 hover:bg-red-600'
    },
    {
      name: 'AI Assistant',
      icon: Bot,
      href: '/search?tab=ai',
      description: 'Ask legal questions',
      permission: 'staff',
      color: 'bg-indigo-500 hover:bg-indigo-600'
    }
  ];

  const statCards = [
    {
      title: 'Total Cases',
      value: stats.totalCases,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Active Cases',
      value: stats.activeCases,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'This Month Uploads',
      value: stats.thisMonthUploads,
      icon: Upload,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'AI Queries',
      value: stats.aiQueries,
      icon: Bot,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {user?.name}
            </h1>
            <p className="text-gray-600 mt-1">
              Employee ID: {user?.employee_id} | Role: {user?.role?.toUpperCase()}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Today is {new Date().toLocaleDateString('en-IN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </div>
          <div className="text-right">
            <div className="w-16 h-16 bg-government-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {user?.name?.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.title} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            if (!hasPermission(action.permission)) return null;
            
            return (
              <Link
                key={action.name}
                to={action.href}
                className="block p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-md ${action.color} text-white`}>
                    <action.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{action.name}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Cases</h2>
          <div className="space-y-3">
            {JSON.parse(localStorage.getItem('cases') || '[]').slice(0, 5).map((case_, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{case_.title}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(case_.uploaded_at).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  case_.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {case_.status}
                </span>
              </div>
            ))}
            {JSON.parse(localStorage.getItem('cases') || '[]').length === 0 && (
              <p className="text-gray-500 text-sm text-center py-4">No cases uploaded yet</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Alerts</h2>
          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">System Maintenance</p>
                <p className="text-xs text-blue-700">Scheduled maintenance on Sunday 2AM-4AM</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
              <Clock className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900">Backup Completed</p>
                <p className="text-xs text-green-700">Daily backup completed successfully</p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
              <Users className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900">Security Update</p>
                <p className="text-xs text-yellow-700">New security policies in effect</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
