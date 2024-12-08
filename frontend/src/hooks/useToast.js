import React, { createContext, useContext, useState } from 'react';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({
    open: false,
    message: '',
    type: 'info', // 'success' | 'error' | 'warning' | 'info'
  });

  const showToast = (message, type = 'info') => {
    setToast({
      open: true,
      message,
      type,
    });
  };

  const hideToast = () => {
    setToast((prev) => ({
      ...prev,
      open: false,
    }));
  };

  return (
    <ToastContext.Provider value={{ toast, showToast, hideToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}; 