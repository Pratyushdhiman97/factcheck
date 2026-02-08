import React from 'react';
import { Toaster } from 'react-hot-toast';

const ToastProvider = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#111',
          color: '#0ff',
          border: '1px solid #0ff',
          fontFamily: 'Inter, sans-serif',
        },
      }}
    />
  );
};

export default ToastProvider;