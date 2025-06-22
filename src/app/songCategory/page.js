'use client';
import React from 'react';
import Navbar from '../components/Navbar';
import './songCategory.css';

const categories = [
    'Entrance',
    'Praise',
    'Holy spirit',
    'Thanksgiving',
    'Midpraise',
    'Surrender',
    'Healing',
    'Worship',
    'Christmas',
];

const SongCategoryPage = () => (
    <div className="song-category-root">
        <Navbar />
        <h1>Song Categories</h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '2rem' }}>
            {categories.map((cat) => (
                <button
                    key={cat}
                    className="category-btn"
                >
                    {cat}
                </button>
            ))}
        </div>
    </div>
);

export default SongCategoryPage;
