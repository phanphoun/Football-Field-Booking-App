

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

import App from './App';

// Suppress browser extension warnings in development
if (process.env.NODE_ENV === 'development') {
  const originalError = console.error;
  const originalWarn = console.warn;
  
  const filterExtensionWarnings = (args) => {
    const message = args[0];
    if (typeof message === 'string') {
      // Filter out chrome-extension related errors
      if (message.includes('chrome-extension://') || 
          message.includes('chrome-extension') ||
          message.includes('elementFromPoint') ||
          message.includes('Failed to fetch dynamically imported module') ||
          message.includes('ResizeObserver loop completed with undelivered notifications')) {
        return true; // Filter out
      }
    }
    return false; // Don't filter
  };
  
  console.error = (...args) => {
    if (!filterExtensionWarnings(args)) {
      originalError.apply(console, args);
    }
  };
  
  console.warn = (...args) => {
    if (!filterExtensionWarnings(args)) {
      originalWarn.apply(console, args);
    }
  };
}

// Patch ResizeObserver to prevent loop errors
const originalResizeObserver = window.ResizeObserver;
window.ResizeObserver = class extends originalResizeObserver {
  constructor(callback) {
    super((entries, observer) => {
      // Use requestAnimationFrame to prevent loop errors
      requestAnimationFrame(() => {
        try {
          callback(entries, observer);
        } catch (error) {
          // Silently ignore ResizeObserver loop errors
          if (error.message === 'ResizeObserver loop completed with undelivered notifications.') {
            return;
          }
          throw error;
        }
      });
    });
  }
};

// Handle ResizeObserver error globally
window.addEventListener('error', (event) => {
  if (event.message === 'ResizeObserver loop completed with undelivered notifications.') {
    event.preventDefault();
    event.stopPropagation();
    return false;
  }
});

// Handle unhandled promise rejections for ResizeObserver
window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message === 'ResizeObserver loop completed with undelivered notifications.') {
    event.preventDefault();
    return false;
  }
});

const root = ReactDOM.createRoot(document.getElementById('root'));
const app = process.env.NODE_ENV === 'development' ? <App /> : (
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

root.render(app);



