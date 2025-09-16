import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Home, 
  Upload, 
  Search, 
  FileText, 
  BarChart3, 
  Shield, 
  Settings,
  LogOut,
  Menu,
  X,
  Bot
} from 'lucide-react';

const Layout = ({ children }) => {
  const { user, logout, hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home, permission: 'viewer' },
    { name: 'Upload Case', href: '/upload', icon: Upload, permission: 'officer' },
    { name: 'Cases', href: '/cases', icon: FileText, permission: 'staff' },
    { name: 'Search & AI', href: '/search', icon: Search, permission: 'staff' },
    { name: 'Reports', href: '/reports', icon: BarChart3, permission: 'officer' },
    { name: 'Audit Logs', href: '/audit', icon: Shield, permission: 'admin' },
    { name: 'Admin Panel', href: '/admin', icon: Settings, permission: 'admin' },
  ];

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'officer': return 'bg-blue-100 text-blue-800';
      case 'staff': return 'bg-green-100 text-green-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-64 bg-government-800 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}>
        <div className="flex items-center justify-between h-16 px-4 bg-government-900">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gold-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">GoI</span>
            </div>
            <span className="text-white font-semibold text-sm">Law Department</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:bg-government-700 p-1 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-5 px-2">
          {navigation.map((item) => {
            if (!hasPermission(item.permission)) return null;
            
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  isActive
                    ? 'bg-government-700 text-white'
                    : 'text-gray-300 hover:bg-government-700 hover:text-white'
                } group flex items-center px-2 py-2 text-sm font-medium rounded-md mb-1 transition-colors duration-200`}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-government-900">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 bg-government-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-xs">
                {user?.name?.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-gray-300 truncate">{user?.employee_id}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user?.role)}`}>
              {user?.role?.toUpperCase()}
            </span>
            <button
              onClick={handleLogout}
              className="text-gray-300 hover:text-white transition-colors duration-200"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                Law Department Portal
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-sm text-gray-500">
                Last login: {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('en-IN') : 'First time'}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
