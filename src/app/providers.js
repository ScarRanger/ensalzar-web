'use client';
import { ZoomProvider } from './components/ZoomContext';

export function Providers({ children }) {
  return (
    <ZoomProvider>
      {children}
    </ZoomProvider>
  );
} 