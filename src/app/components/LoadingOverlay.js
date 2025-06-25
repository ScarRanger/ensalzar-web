'use client';
import React from 'react';
import './LoadingOverlay.css';

export default function LoadingOverlay() {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner"></div>
    </div>
  );
} 