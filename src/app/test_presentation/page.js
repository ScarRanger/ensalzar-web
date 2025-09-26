// app/presentation/page.js
'use client';
import React, { useState, useEffect } from 'react';
import './presentation.css';

export default function PresentationPage() {
    const [currentSlideHTML, setCurrentSlideHTML] = useState(
        '<p class="placeholder">Waiting for presenter...</p>'
    );

    useEffect(() => {
        const applyState = (raw) => {
            try {
                const newState = JSON.parse(raw);
                if (newState && newState.slides && typeof newState.currentSlide !== 'undefined') {
                    const slideContent = newState.slides[newState.currentSlide] || '';
                    setCurrentSlideHTML(slideContent);
                }
            } catch (e) {
                console.error('Failed to parse presentation state:', e);
            }
        };

        // Load immediately if state already exists
        const existing = localStorage.getItem('ensalzar-presentation-state');
        if (existing) applyState(existing);

        const handleStorageChange = (event) => {
            if (event.key === 'ensalzar-presentation-state') {
                applyState(event.newValue);
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    return (
        <div className="presentation-container">
            <div 
                className="slide-display" 
                dangerouslySetInnerHTML={{ __html: currentSlideHTML }} 
            />
        </div>
    );
}