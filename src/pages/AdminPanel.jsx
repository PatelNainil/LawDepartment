import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Settings, 
  Users, 
  Shield, 
  Edit, 
  Save, 
  X,
  AlertCircle,
  CheckCircle,
  UserCheck,
  UserX,
  Monitor
} from 'lucide-react';

const AdminPanel = () => {
  const { user, hasPermission, employees } = useAuth();
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [systemSettings, setSystemSettings] = useState({
    sessionTimeout: 30,
    maxFileSize: 10,
    retentionPeriod: 365,
    enableAuditLogs: true,
    enableEmailNotifications: false
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    // Load system settings from localStorage
    const savedSettings = localStorage.getItem('systemSettings');
    if (savedSettings) {
      setSystemSettings(JSON.parse(savedSettings));
    }
  }, []);

  if (!hasPermission('admin')) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access the admin panel.</p>
        </div>
      </div>
    );
  }

  const startEditing = (employee) => {
    setEditingEmployee(employee.id);
    setEditForm({
      name: employee.name,
      mobile_number: employee.mobile_number,
      role: employee.role,
      is_active: employee.is_active
    });
  };

  const cancelEditing = () => {
    setEditingEmployee(null);
    setEditForm({});
  };

  const saveEmployee = () => {
    setSaving(true);
    
    // In a real app, this would make an API call
    setTimeout(() => {
      // Update employee in localStorage (simulation)
      const updatedEmployees = employees.map(emp => 
        emp.id === editingEmployee 
          ? { ...emp, ...editForm }
          : emp
      );
      
      // This is just for simulation - in real app, would update through proper state management
      setMessage({ type: 'success', text: 'Employee updated successfully' });
      setEditingEmployee(null);
      setEditForm({});
      setSaving(false);
      
      setTimeout(() => setMessage(null), 3000);
    }, 1000);
  };

  const saveSystemSettings = () => {
    setSaving(true);
    
    setTimeout(() => {
      localStorage.setItem('systemSettings', JSON.stringify(systemSettings));
      setMessage({ type: 'success', text: 'System settings updated successfully' });
      setSaving(false);
      
      setTimeout(() => setMessage(null), 3000);
    }, 1000);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'officer': return 'bg-blue-100 text-blue-800';
      case 'staff': return 'bg-green-100 text-green-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSystemStats = () => {
    const auditLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
    const cases = JSON.parse(localStorage.getItem('cases') || '[]');
    const today = new Date().toDateString();
    
    return {
      totalUsers: employees.length,
      activeUsers: employees.filter(emp => emp.is_active).length,
      todayLogins: auditLogs.filter(log => 
        log.action === 'login' && 
        new Date(log.timestamp).toDateString() === today
      ).length,
      totalCases: cases.length,
      systemHealth: 'Good'
    };
  };

  const stats = getSystemStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Settings className="w-6 h-6 mr-2" />
              Admin Panel
            </h1>
            <p className="text-gray-600 mt-1">
              Manage users, system settings, and monitor system health
            </p>
          </div>
          
          {message && (
            <div className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800' 
                : 'bg-red-50 text-red-800'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">{message.text}</span>
            </div>
          )}
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <UserCheck className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Shield className="w-8 h-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Today Logins</p>
              <p className="text-2xl font-bold text-gray-900">{stats.todayLogins}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Shield className="w-8 h-8 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Cases</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCases}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <Monitor className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">System Health</p>
              <p className="text-lg font-bold text-green-600">{stats.systemHealth}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Management */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Employee Management
        </h2>

        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mobile
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingEmployee === employee.id ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        className="text-sm font-medium text-gray-900 border border-gray-300 rounded px-2 py-1"
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {employee.employee_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingEmployee === employee.id ? (
                      <input
                        type="text"
                        value={editForm.mobile_number}
                        onChange={(e) => setEditForm(prev => ({ ...prev, mobile_number: e.target.value }))}
                        className="text-sm text-gray-900 border border-gray-300 rounded px-2 py-1"
                      />
                    ) : (
                      <div className="text-sm text-gray-900">{employee.mobile_number}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingEmployee === employee.id ? (
                      <select
                        value={editForm.role}
                        onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="admin">Admin</option>
                        <option value="officer">Officer</option>
                        <option value="staff">Staff</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(employee.role)}`}>
                        {employee.role.toUpperCase()}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingEmployee === employee.id ? (
                      <select
                        value={editForm.is_active}
                        onChange={(e) => setEditForm(prev => ({ ...prev, is_active: e.target.value === 'true' }))}
                        className="text-xs border border-gray-300 rounded px-2 py-1"
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        employee.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {employee.is_active ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {editingEmployee === employee.id ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={saveEmployee}
                          disabled={saving}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEditing}
                          disabled={saving}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditing(employee)}
                        className="text-government-600 hover:text-government-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* System Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          System Settings
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Timeout (minutes)
            </label>
            <input
              type="number"
              value={systemSettings.sessionTimeout}
              onChange={(e) => setSystemSettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-government-500 focus:border-government-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max File Size (MB)
            </label>
            <input
              type="number"
              value={systemSettings.maxFileSize}
              onChange={(e) => setSystemSettings(prev => ({ ...prev, maxFileSize: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-government-500 focus:border-government-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Log Retention Period (days)
            </label>
            <input
              type="number"
              value={systemSettings.retentionPeriod}
              onChange={(e) => setSystemSettings(prev => ({ ...prev, retentionPeriod: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-government-500 focus:border-government-500"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="auditLogs"
                checked={systemSettings.enableAuditLogs}
                onChange={(e) => setSystemSettings(prev => ({ ...prev, enableAuditLogs: e.target.checked }))}
                className="h-4 w-4 text-government-600 focus:ring-government-500 border-gray-300 rounded"
              />
              <label htmlFor="auditLogs" className="ml-2 block text-sm text-gray-900">
                Enable Audit Logs
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="emailNotifications"
                checked={systemSettings.enableEmailNotifications}
                onChange={(e) => setSystemSettings(prev => ({ ...prev, enableEmailNotifications: e.target.checked }))}
                className="h-4 w-4 text-government-600 focus:ring-government-500 border-gray-300 rounded"
              />
              <label htmlFor="emailNotifications" className="ml-2 block text-sm text-gray-900">
                Enable Email Notifications
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={saveSystemSettings}
            disabled={saving}
            className="px-6 py-2 bg-government-600 text-white font-medium rounded-md hover:bg-government-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-government-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
