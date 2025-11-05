import React from 'react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="border border-gray-300 rounded-lg p-8 max-w-md w-full mx-auto bg-white">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-400 mb-4">404</h1>
          <p className="text-xl text-gray-500 mb-4">Page Not Found</p>
          <p className="text-gray-600">
            The page you are looking for might have been removed, had its name changed, 
            or is temporarily unavailable.
          </p>
        </div>
      </div>
    </div>
  );
}