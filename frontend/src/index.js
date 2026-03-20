

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
          message.includes('Failed to fetch dynamically imported module')) {
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

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);



