import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

// Predefined employee accounts
const EMPLOYEES = [
  { id: 1, employee_id: 'LAW001', name: 'Priya Sharma', mobile_number: '+91-9876543210', role: 'admin', is_active: true },
  { id: 2, employee_id: 'LAW002', name: 'Rajesh Kumar', mobile_number: '+91-9876543211', role: 'officer', is_active: true },
  { id: 3, employee_id: 'LAW003', name: 'Anita Singh', mobile_number: '+91-9876543212', role: 'officer', is_active: true },
  { id: 4, employee_id: 'LAW004', name: 'Vikram Gupta', mobile_number: '+91-9876543213', role: 'staff', is_active: true },
  { id: 5, employee_id: 'LAW005', name: 'Meera Nair', mobile_number: '+91-9876543214', role: 'viewer', is_active: true }
];

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [otpSent, setOtpSent] = useState(false);
  const [pendingMobile, setPendingMobile] = useState('');
  const [debugOTP, setDebugOTP] = useState('');

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('lawPortalUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const requestOTP = async (mobileNumber) => {
    try {
      // Find employee by mobile number
      const employee = EMPLOYEES.find(emp => emp.mobile_number === mobileNumber && emp.is_active);
      if (!employee) {
        throw new Error('Invalid mobile number or account not active');
      }

      // Simulate OTP generation (in real app, this would be sent via SMS)
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log(`OTP for ${mobileNumber}: ${otp}`); // In production, this would be sent via SMS
      setDebugOTP(otp);
      
      // Store OTP temporarily (in real app, this would be in backend)
      sessionStorage.setItem('pendingOTP', otp);
      sessionStorage.setItem('pendingEmployee', JSON.stringify(employee));
      
      setPendingMobile(mobileNumber);
      setOtpSent(true);
      
      return { success: true, message: 'OTP sent successfully' };
    } catch (error) {
      setDebugOTP('');
      return { success: false, message: error.message };
    }
  };

  const verifyOTP = async (otp) => {
    try {
      const storedOTP = sessionStorage.getItem('pendingOTP');
      const pendingEmployee = JSON.parse(sessionStorage.getItem('pendingEmployee') || '{}');

      if (otp !== storedOTP) {
        throw new Error('Invalid OTP');
      }

      // Clear temporary data
      sessionStorage.removeItem('pendingOTP');
      sessionStorage.removeItem('pendingEmployee');

      // Set user session
      const userSession = {
        ...pendingEmployee,
        lastLoginAt: new Date().toISOString()
      };

      setUser(userSession);
      localStorage.setItem('lawPortalUser', JSON.stringify(userSession));
      setOtpSent(false);
      setPendingMobile('');
      setDebugOTP('');

      // Log audit entry
      logAuditEntry(pendingEmployee.id, 'login', 'User logged in successfully', '127.0.0.1');

      return { success: true, message: 'Login successful' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    if (user) {
      logAuditEntry(user.id, 'logout', 'User logged out', '127.0.0.1');
    }
    setUser(null);
    localStorage.removeItem('lawPortalUser');
    setOtpSent(false);
    setPendingMobile('');
    setDebugOTP('');
  };

  const logAuditEntry = (employeeId, action, details, ipAddress) => {
    const auditLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
    const newEntry = {
      id: Date.now(),
      employee_id: employeeId,
      action,
      details,
      ip_address: ipAddress,
      timestamp: new Date().toISOString()
    };
    auditLogs.unshift(newEntry);
    localStorage.setItem('auditLogs', JSON.stringify(auditLogs.slice(0, 1000))); // Keep last 1000 entries
  };

  const hasPermission = (requiredRole) => {
    if (!user) return false;
    
    const roleHierarchy = {
      'admin': 4,
      'officer': 3,
      'staff': 2,
      'viewer': 1
    };

    return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
  };

  const value = {
    user,
    loading,
    otpSent,
    pendingMobile,
    debugOTP,
    requestOTP,
    verifyOTP,
    logout,
    hasPermission,
    logAuditEntry,
    employees: EMPLOYEES
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
