'use client';
import React, { useEffect, useState } from 'react';
import { useZoom } from '../../components/ZoomContext';
import LoadingOverlay from '../../components/LoadingOverlay';
import '../songList.css';
import '../songHtml.css';
import { useRouter } from 'next/navigation';
import { fetchSongData } from '../../songData';
import { useUser } from '../../components/useUser';
import { supabase } from '../../components/supabaseClient';

export default function SongDetailPage({ params }) {
  const [html, setHtml] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showChords, setShowChords] = useState(true);
  const [transpose, setTranspose] = useState(0);
  const { zoomLevel, zoomIn, zoomOut } = useZoom();
  const { fileName } = React.use(params);
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const { user } = useUser();
  const [isDaily, setIsDaily] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!fileName) return;
    setLoading(true);
    const fetchHtml = async () => {
      setHtml('');
      setError('');
      try {
        const url = `https://cgs-songs-config.s3.ap-south-1.amazonaws.com/${decodeURIComponent(fileName)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Could not fetch file');
        const text = await res.text();
        setHtml(text);
      } catch (err) {
        setError('Could not fetch file: ' + err.message);
      }
      setLoading(false);
    };
    fetchHtml();
  }, [fileName]);

  useEffect(() => {
    if (!user || !fileName) return;
    // Check if song is already in daily songs
    supabase
      .from('daily_songs')
      .select('song_filename')
      .eq('user_id', user.id)
      .eq('date', today)
      .eq('song_filename', fileName)
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) setIsDaily(true);
        else setIsDaily(false);
      });
  }, [user, fileName, today]);

  // Chord transpose logic
  useEffect(() => {
    if (!html) return;
    // Wait for DOM update
    setTimeout(() => {
      const chordEls = document.querySelectorAll('.song-html-content .chord');
      chordEls.forEach(el => {
        const original = el.getAttribute('data-original') || el.textContent;
        el.setAttribute('data-original', original);
        el.textContent = transposeChord(original, transpose);
      });
    }, 0);
  }, [html, transpose, showChords]);

  function transposeChord(chord, steps) {
    // Basic chord transpose for C, C#, D, D#, E, F, F#, G, G#, A, A#, B
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    // Regex: match root note and accidental, then rest
    return chord.replace(/([A-G](#|b)?)([^/\s]*)/g, (m, root, accidental, rest) => {
      let idx = notes.indexOf(root + (accidental || ''));
      if (idx === -1) return m;
      let newIdx = (idx + steps + 12) % 12;
      return notes[newIdx] + (rest || '');
    });
  }

  // Toggle chord visibility by adding/removing a class
  const chordToggleClass = showChords ? '' : 'hide-chords';

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSaveToDaily = async () => {
    if (!user) return alert('Please log in.');
    setLoading(true);
    const songData = await fetchSongData();
    const song = songData.songs.find(s => s.src === decodeURIComponent(fileName));
    if (!song) {
      setLoading(false);
      return alert('Song not found.');
    }
    const song_filename = song.fileName || song.src;
    const song_title = song.title || song.name;
    const username = user.user_metadata?.username || user.email;
    const { error } = await supabase.from('daily_songs').upsert({
      user_id: user.id,
      date: today,
      song_filename,
      song_title,
      username,
    }, { onConflict: ['user_id', 'date', 'song_filename'] });
    if (error) alert('Error saving to daily: ' + error.message);
    else setIsDaily(true);
    setLoading(false);
  };

  const handleRemoveFromDaily = async () => {
    if (!user) return;
    setLoading(true);
    const song_filename = fileName;
    const { error } = await supabase.from('daily_songs').delete()
      .eq('user_id', user.id)
      .eq('date', today)
      .eq('song_filename', song_filename);
    if (error) alert('Error removing from daily: ' + error.message);
    else setIsDaily(false);
    setLoading(false);
  };

  return (
    <div>
      <div
        className="song-controls-bar no-zoom"
      >
        <button onClick={() => router.back()} style={{ fontSize: '1.1em', padding: '0.5em 1.2em', borderRadius: 6, border: 'none', background: '#e3eafc', color: '#1976d2', fontWeight: 700, cursor: 'pointer', marginRight: '1.5rem' }}>← Back</button>
        {isDaily ? (
          <button onClick={handleRemoveFromDaily} className="song-action-btn done-btn active" style={{ marginRight: '1.5rem' }}>Added!</button>
        ) : (
          <button onClick={handleSaveToDaily} className="song-action-btn done-btn" style={{ marginRight: '1.5rem' }}>Done</button>
        )}
        <div className="song-control-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button onClick={() => setTranspose(t => t - 1)} style={{ fontSize: '1.3em', padding: '0.2em 0.7em', borderRadius: 6, border: 'none', background: '#1976d2', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>-</button>
          <span style={{ minWidth: 40, textAlign: 'center', fontWeight: 600, color: '#1976d2' }}>Transpose: {transpose}</span>
          <button onClick={() => setTranspose(t => t + 1)} style={{ fontSize: '1.3em', padding: '0.2em 0.7em', borderRadius: 6, border: 'none', background: '#1976d2', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>+</button>
        </div>
        <div className="song-control-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label className="toggle-switch" aria-label="Show Chords">
              <input
                type="checkbox"
                checked={showChords}
                onChange={() => setShowChords(v => !v)}
              />
              <span className="slider" />
            </label>
            <span className="show-chords-label" style={{ fontWeight: 500, marginLeft: '0.5em' }}>Show Chords</span>
          </div>
        </div>
      </div>
      {loading && <LoadingOverlay />}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <div
        style={{ overflow: 'auto', width: '100%', height: '100%', position: 'relative' }}
      >
        <div className="zoomable-content">
          <div
            className={`html-content-container song-html-content ${chordToggleClass}`}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>


      {/* Add zoom controls as a fixed overlay at the bottom only on mobile */}
      {isMobile && (
        <div className="zoom-controls-overlay">
          <button onClick={zoomOut} style={{ fontSize: '1.3em', padding: '0.2em 0.7em', borderRadius: 6, border: 'none', background: '#1976d2', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>-</button>
          <span style={{ minWidth: 40, textAlign: 'center', fontWeight: 600, color: '#1976d2' }}>Zoom: {Math.round(zoomLevel * 100)}%</span>
          <button onClick={zoomIn} style={{ fontSize: '1.3em', padding: '0.2em 0.7em', borderRadius: 6, border: 'none', background: '#1976d2', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>+</button>
        </div>
      )}
    </div>
  );
} 