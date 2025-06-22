'use client';
import React, { createContext, useState, useContext, useMemo } from 'react';

const ZoomContext = createContext(null);

export const ZoomProvider = ({ children }) => {
  const [zoomLevel, setZoomLevel] = useState(1);

  const zoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 3));
  const zoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.5));

  const value = useMemo(() => ({
    zoomLevel,
    zoomIn,
    zoomOut,
  }), [zoomLevel]);

  return (
    <ZoomContext.Provider value={value}>
      {children}
    </ZoomContext.Provider>
  );
};

export const useZoom = () => {
  const context = useContext(ZoomContext);
  if (context === null) {
    throw new Error('useZoom must be used within a ZoomProvider');
  }
  return context;
}; 