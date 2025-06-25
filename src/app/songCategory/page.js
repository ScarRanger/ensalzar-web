'use client';
import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { songs } from '../songData';
import { useRouter } from 'next/navigation';
import LoadingOverlay from '../components/LoadingOverlay';
import './songCategory.css';

const SongCategoryPage = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        // Simulate loading for demonstration; replace with real async if needed
        setTimeout(() => {
            setCategories(Array.from(new Set(songs.map(song => song.category))));
            setLoading(false);
        }, 300);
    }, []);

    const handleCategoryClick = (cat) => {
        router.push(`/songList?category=${encodeURIComponent(cat)}`);
    };

    return (
        <div className="song-category-root">
            <Navbar />
            {loading && <LoadingOverlay />}
            <h1>Song Categories</h1>
            <div className="category-list">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        className="category-btn"
                        onClick={() => handleCategoryClick(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SongCategoryPage;
