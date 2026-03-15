import React from 'react';
import ReactDOM from 'react-dom/client';
import { LazyMotion, domAnimation } from 'framer-motion';
import App from './App.jsx';
import './index.css';
import { Toaster } from 'react-hot-toast';

console.log('[PHASE 1] Jana Sunuwaai frontend initialized');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LazyMotion features={domAnimation}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#FFFFFF',
            color: '#111827',
            borderRadius: '0.75rem',
            fontSize: '0.875rem',
            padding: '0.75rem 1rem',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          },
          success: {
            style: { borderLeft: '4px solid #16A34A' },
            iconTheme: { primary: '#16A34A', secondary: '#FFFFFF' },
          },
          error: {
            style: { borderLeft: '4px solid #DC2626' },
            iconTheme: { primary: '#DC2626', secondary: '#FFFFFF' },
          },
        }}
      />
    </LazyMotion>
  </React.StrictMode>
);
