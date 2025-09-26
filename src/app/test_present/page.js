// app/present/page.js
'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import LoadingOverlay from '../components/LoadingOverlay';
import './presenter.css';

// --- V V V --- REPLACE THE OLD FUNCTION WITH THIS NEW ONE --- V V V ---

/**
 * Parses the song HTML content into distinct slides for presentation.
 * This function is specifically tailored to handle the provided HTML structure
 * with lyrics inside a <pre> tag and chords in <div class="chord">.
 *
 * @param {string} htmlContent - The raw HTML string of the song.
 * @returns {string[]} An array of strings, where each string is an HTML-formatted slide.
 */
const parseSongToSlides = (htmlContent) => {
    if (!htmlContent) return [];

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    const preElement = doc.querySelector('pre');
    if (!preElement) return ['<p>Error: Song content format is incorrect.</p>'];

    // Work on clone
    const root = preElement.cloneNode(true);

    // Remove chords
    root.querySelectorAll('.chord').forEach(n => n.remove());

    // Collect slides from <section> elements
    const sections = Array.from(root.querySelectorAll('section'));
    const slides = [];
    sections.forEach(section => {
        const cls = section.className || '';
        // Previously skipped chorus; now include every section
        // Remove any heading siblings preceding this section (with class heading)
        let prev = section.previousElementSibling;
        while (prev && prev.classList && prev.classList.contains('heading')) {
            // Remove heading entirely (hidden from slides)
            const toRemove = prev;
            prev = prev.previousElementSibling;
            toRemove.remove();
        }
        // Clone cleaned section content
        const clone = section.cloneNode(true);
        // Strip class attributes to keep output clean
        clone.removeAttribute('class');
        const html = clone.innerHTML.trim();
        if (html) {
            slides.push(`<div class="lyric-slide"><pre>${html}</pre></div>`);
        }
    });

    if (slides.length === 0) {
        // Fallback: whole content without chords/chorus
        return [`<div class="lyric-slide"><pre>${root.innerHTML.trim()}</pre></div>`];
    }
    return slides;
};

// --- ^ ^ ^ --- THE REST OF THE FILE REMAINS EXACTLY THE SAME --- ^ ^ ^ ---

// Embedded Above All Powers song (test environment only)
const ABOVE_ALL_POWERS_HTML = `<!DOCTYPE html><html><body><pre>
<span><h2> Above All Powers </h2></span>
<div class="heading">Verse 1</div>
<section class="verse1">
<div class="chord">A</div>           <div class="chord">D</div>     <div class="chord">E</div>            <div class="chord">A</div>
Above all powers,   Above all Kings
        <div class="chord">D</div>         <div class="chord">E</div>            <div class="chord">A</div>
Above all nature, and all created things
        <div class="chord">F#m</div>        <div class="chord">E</div>               <div class="chord">D</div>  <div class="chord">A</div>
Above all wisdom, and all the ways of  man
<div class="chord">Bm</div>              <div class="chord">D</div>                  <div class="chord">Esus</div>  <div class="chord">E</div>
You were here before the world be-gan
</section>
<div class="heading">Verse 2</div>
<section class="verse2">
      <div class="chord">D</div>        <div class="chord">E</div>            <div class="chord">A</div>
Above all kingdoms,  Above all thrones
      <div class="chord">D</div>            <div class="chord">E</div>              <div class="chord">A</div>
Above all wonders this world has ever known
      <div class="chord">F#m</div>          <div class="chord">E</div>               <div class="chord">D</div>   <div class="chord">A</div>
Above all wealth and treasures of the earth
<div class="chord">Bm</div>                <div class="chord">D</div>                   <div class="chord">C#7sus</div> <div class="chord">C#7</div>
There's no way to measure what you're worth
</section>
<div class="heading">Chorus</div>
<section class="chorus">
<div class="chord">A</div>     <div class="chord">Bm</div>   <div class="chord">E</div>             <div class="chord">A</div>
Crucified, laid behind a stone
<div class="chord">A</div>            <div class="chord">Bm</div>       <div class="chord">E</div>            <div class="chord">A</div>
You lived to die, re-jected and a-lone
    <div class="chord">F#m</div>   <div class="chord">E</div>               <div class="chord">D</div>   <div class="chord">A</div>
Like a rose, trampled on the ground
         <div class="chord">Bm</div>   <div class="chord">A</div>                  <div class="chord">D</div>  <div class="chord">E</div>
You took the fall,   and thought of me
       <div class="chord">A</div>
Above all
</section>
</pre></body></html>`;


export default function PresenterPage() {
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [songList, setSongList] = useState([
        { song_filename: 'above_all_powers.html', song_title: 'Above All Powers', html: ABOVE_ALL_POWERS_HTML }
    ]);
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

    // Auto-select the embedded song on mount
    useEffect(() => {
        if (songList.length > 0) {
            setSelectedSong(songList[0]);
            const slidesParsed = parseSongToSlides(songList[0].html);
            setSlides(slidesParsed);
        }
    }, [songList]);

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
                        if (song.html) {
                            const slidesParsed = parseSongToSlides(song.html);
                            setSlides(slidesParsed);
                        }
                    };

                    const openPresentationWindow = () => {
                        if (!selectedSong) return;
                        // Force a fresh broadcast by including timestamp
                        const state = {
                            slides,
                            currentSlide: currentSlideIndex,
                            song: selectedSong.song_title,
                            ts: Date.now()
                        };
                        localStorage.setItem('ensalzar-presentation-state', JSON.stringify(state));
                        const url = `/test_presentation`;
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
                    <ul>
                        {songList.map(song => (
                            <li key={song.song_filename}>
                                <button
                                    onClick={() => handleSelectSong(song)}
                                    className={selectedSong?.song_filename === song.song_filename ? 'active' : ''}
                                >
                                    {song.song_title}
                                </button>
                            </li>
                        ))}
                    </ul>
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