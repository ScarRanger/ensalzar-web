// app/present/page.js
'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import LoadingOverlay from '../components/LoadingOverlay';
import './presenter.css';

// --- V V V --- REPLACE THE OLD FUNCTION WITH THIS NEW ONE --- V V V ---

/**
 * Parses the song HTML content into distinct slides for presentation using semantic <section> blocks.
 * - Removes chords (<div class="chord">)
 * - Builds one slide per <section>
 * - Strips preceding <div class="heading"> siblings so slides contain only lyrics
 */
const parseSongToSlides = (htmlContent) => {
    if (!htmlContent) return [];

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const preElement = doc.querySelector('pre');
    if (!preElement) return ['<p>Error: Song content format is incorrect.</p>'];

    const root = preElement.cloneNode(true);
    // remove chords
    root.querySelectorAll('.chord').forEach(n => n.remove());

    const sections = Array.from(root.querySelectorAll('section'));
    const slides = [];
    sections.forEach(section => {
        // remove any immediate heading siblings before this section
        let prev = section.previousElementSibling;
        while (prev && prev.classList && prev.classList.contains('heading')) {
            const toRemove = prev;
            prev = prev.previousElementSibling;
            toRemove.remove();
        }
        const clone = section.cloneNode(true);
        clone.removeAttribute('class');
        const html = clone.innerHTML.trim();
        if (html) slides.push(`<div class="lyric-slide"><pre>${html}</pre></div>`);
    });

    if (slides.length === 0) {
        return [`<div class="lyric-slide"><pre>${root.innerHTML.trim()}</pre></div>`];
    }
    return slides;
};

// --- ^ ^ ^ --- THE REST OF THE FILE REMAINS EXACTLY THE SAME --- ^ ^ ^ ---


export default function PresenterPage() {
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [songList, setSongList] = useState([]);
    const [selectedSong, setSelectedSong] = useState(null);
    const [slides, setSlides] = useState([]);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

    // Sync presentation state to localStorage for presentation window
    useEffect(() => {
        if (slides.length > 0) {
            const state = {
                slides,
                currentSlide: currentSlideIndex,
                song: selectedSong?.song_title || '',
            };
            localStorage.setItem('ensalzar-presentation-state', JSON.stringify(state));
        }
    }, [slides, currentSlideIndex, selectedSong]);

    const presentationWindow = useRef(null);
    const today = new Date().toISOString().slice(0, 10);

    // Fetch song list from S3
    useEffect(() => {
        setLoading(true);
        import('../songData').then(({ fetchSongData }) => {
            fetchSongData()
                .then(data => {
                    // If data.songs exists, use it, else fallback to data
                    setSongList(data.songs || data);
                })
                .catch(() => setSongList([]))
                .finally(() => setLoading(false));
        });
    }, []);

                    

                    const handleNext = useCallback(() => {
                        setCurrentSlideIndex(idx => (idx < slides.length - 1 ? idx + 1 : idx));
                    }, [slides.length]);
                    const handlePrev = useCallback(() => {
                        setCurrentSlideIndex(idx => (idx > 0 ? idx - 1 : idx));
                    }, []);

                    useEffect(() => {
                        const handleKeyDown = (e) => {
                            if (e.key === 'ArrowRight') handleNext();
                            if (e.key === 'ArrowLeft') handlePrev();
                        };
                        window.addEventListener('keydown', handleKeyDown);
                        return () => window.removeEventListener('keydown', handleKeyDown);
                    }, [handleNext, handlePrev]);

                    const handleSelectSong = (song) => {
                        setSelectedSong(song);
                        setCurrentSlideIndex(0);
                        setLoading(true);
                        const baseName = song.song_filename.endsWith('.html') ? song.song_filename : `${song.song_filename}.html`;
                        fetch(`https://cgs-songs-config.s3.ap-south-1.amazonaws.com/${baseName}`)
                            .then(res => res.text())
                            .then(html => setSlides(parseSongToSlides(html)))
                            .catch(() => setSlides(['<p>Error loading song.</p>']))
                            .finally(() => setLoading(false));
                    };

                    const openPresentationWindow = () => {
                        if (!selectedSong) return;
                        // Force a fresh broadcast by including timestamp for the presentation to load immediately
                        const state = {
                            slides,
                            currentSlide: currentSlideIndex,
                            song: selectedSong.song_title || selectedSong.title || '',
                            ts: Date.now(),
                        };
                        localStorage.setItem('ensalzar-presentation-state', JSON.stringify(state));
                        const url = `/presentation`;
                        window.open(url, '_blank', 'noopener,width=900,height=700');
                    };

                    return (
        <div className="presenter-container" style={{ background: 'linear-gradient(135deg, #e3eafc 0%, #f8faff 100%)', minHeight: '100vh' }}>
            {loading && <LoadingOverlay />}
            <header className="presenter-header">
                <h1>Presenter View</h1>
                <button onClick={openPresentationWindow} className="presenter-btn">
                    Open Presentation Window
                </button>
            </header>
            <div className="presenter-body">
                <aside className="song-selection-panel">
                    <h3>Song List</h3>
                    <input
                        type="text"
                        placeholder="Search songs..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ width: '100%', marginBottom: '1rem', padding: '0.5rem', fontSize: '1rem', borderRadius: 6, border: '1px solid #ccc' }}
                    />
                    {songList.length > 0 ? (
                        <ul>
                            {songList
                                .filter(song => {
                                    const q = search.toLowerCase();
                                    const title = (song.title || song.name || '').toLowerCase();
                                    return title.includes(q);
                                })
                                .map(song => (
                                    <li key={song.fileName || song.src}>
                                        <button 
                                            onClick={() => handleSelectSong({ song_filename: song.fileName || song.src, song_title: song.title || song.name, src: song.src, fileName: song.fileName })}
                                            className={selectedSong?.song_filename === (song.fileName || song.src) ? 'active' : ''}
                                        >
                                            {song.title || song.name}
                                        </button>
                                    </li>
                                ))}
                        </ul>
                    ) : (
                        <p>No songs found.</p>
                    )}
                </aside>
                <main className="slide-control-panel">
                    {selectedSong ? (
                        <React.Fragment>
                            <h3>Now Presenting: {selectedSong.song_title}</h3>
                            <div className="slide-previews">
                                <div className="slide-preview current" style={{ maxHeight: '50vh', overflowY: 'auto', border: '1px solid #eee', borderRadius: 8, padding: '1rem', background: '#fff' }}>
                                    <h4>Current Slide</h4>
                                    <div className="slide-content" dangerouslySetInnerHTML={{ __html: slides[currentSlideIndex] || '<p>Select a song</p>' }} />
                                </div>
                                <div className="slide-preview next" style={{ maxHeight: '50vh', overflowY: 'auto', border: '1px solid #eee', borderRadius: 8, padding: '1rem', background: '#fff', marginTop: '1rem' }}>
                                    <h4>Next Slide</h4>
                                    <div className="slide-content" dangerouslySetInnerHTML={{ __html: slides[currentSlideIndex + 1] || '<p>End of song</p>' }} />
                                </div>
                            </div>
                            <div className="slide-navigation">
                                <button onClick={handlePrev} disabled={currentSlideIndex === 0}>Previous</button>
                                <span>{currentSlideIndex + 1} / {slides.length}</span>
                                <button onClick={handleNext} disabled={currentSlideIndex >= slides.length - 1}>Next</button>
                            </div>
                        </React.Fragment>
                    ) : (
                        <div className="no-song-selected">
                            <p>Please select a song from the list on the left.</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}