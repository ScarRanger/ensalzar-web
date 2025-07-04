'use client';
import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navbar from '../components/Navbar';
import { fetchSongData } from '../songData';
import { useUser } from '../components/useUser';
import LoadingOverlay from '../components/LoadingOverlay';
import './songList.css';
import { supabase } from '../components/supabaseClient';

function SongListContent({ language, setLanguage }) {
    const searchParams = useSearchParams();
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const { user } = useUser();
    const [songs, setSongs] = useState([]);
    const [dailySongs, setDailySongs] = useState({});
    const [savedSongs, setSavedSongs] = useState({});
    const [loading, setLoading] = useState(false);

    const today = new Date().toISOString().slice(0, 10);

    useEffect(() => {
        setLoading(true);
        fetchSongData().then(data => {
            let filtered = data.songs;
            if (category) {
                filtered = filtered.filter(song => song.tags?.includes(category));
            }
            if (search) {
                const q = search.toLowerCase();
                filtered = filtered.filter(song =>
                    (song.title && song.title.toLowerCase().includes(q)) ||
                    (song.category && song.category.toLowerCase().includes(q))
                );
            }
            // Filter by language tab
            filtered = filtered.filter(song => song.lang && song.lang.toLowerCase() === language);
            setSongs(filtered);
            setLoading(false);
        });
    }, [category, search, language]);

    useEffect(() => {
        if (!user) {
            setSavedSongs({});
            setDailySongs({});
            return;
        }
        setLoading(true);
        // Fetch saved songs
        supabase
            .from('saved_songs')
            .select('song_filename')
            .eq('user_id', user.id)
            .then(({ data, error }) => {
                if (error) {
                    console.error('Error fetching saved songs:', error);
                    setSavedSongs({});
                } else {
                    const map = {};
                    data?.forEach(row => { if (row.song_filename) map[row.song_filename] = true; });
                    setSavedSongs(map);
                }
            });
        // Fetch daily songs for today
        supabase
            .from('daily_songs')
            .select('song_filename')
            .eq('user_id', user.id)
            .eq('date', today)
            .then(({ data, error }) => {
                if (error) {
                    console.error('Error fetching daily songs:', error);
                    setDailySongs({});
                } else {
                    const map = {};
                    data?.forEach(row => { if (row.song_filename) map[row.song_filename] = true; });
                    setDailySongs(map);
                }
                setLoading(false);
            });
    }, [user, today]);

    const handleSaveToDaily = async (song) => {
        if (!user) return alert('Please log in.');
        setLoading(true);
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
        if (error) console.error('Error saving to daily:', error);
        else setDailySongs(prev => ({ ...prev, [song_filename]: true }));
        setLoading(false);
    };

    const handleRemoveFromDaily = async (song) => {
        if (!user) return;
        setLoading(true);
        const song_filename = song.fileName || song.src;
        const { error } = await supabase.from('daily_songs').delete()
            .eq('user_id', user.id)
            .eq('date', today)
            .eq('song_filename', song_filename);
        if (error) console.error('Error removing from daily:', error);
        else setDailySongs(prev => {
            const newDaily = { ...prev };
            delete newDaily[song_filename];
            return newDaily;
        });
        setLoading(false);
    };

    const handleSaveSong = async (song) => {
        if (!user) return alert('Please log in.');
        setLoading(true);
        const song_filename = song.fileName || song.src;
        const song_title = song.title || song.name;
        const username = user.user_metadata?.username || user.email;
        const { error } = await supabase.from('saved_songs').upsert({
            user_id: user.id,
            song_filename,
            song_title,
            username,
        });
        if (error) console.error('Error saving song:', error);
        else setSavedSongs(prev => ({ ...prev, [song_filename]: true }));
        setLoading(false);
    };

    const handleRemoveSavedSong = async (song) => {
        if (!user) return;
        setLoading(true);
        const song_filename = song.fileName || song.src;
        const { error } = await supabase.from('saved_songs').delete()
            .eq('user_id', user.id)
            .eq('song_filename', song_filename);
        if (error) console.error('Error removing saved song:', error);
        else setSavedSongs(prev => {
            const newSaved = { ...prev };
            delete newSaved[song_filename];
            return newSaved;
        });
        setLoading(false);
    };

    return (
        <div className="song-list-container">
            <div className="song-list-sidebar full-width">
                <h2>{category ? `${category} Songs` : 'Song List'}</h2>
                <ul>
                    {songs.length === 0 ? (
                        <li style={{ textAlign: 'center', color: '#888', width: '100%' }}>No songs found.</li>
                    ) : (
                        songs.map(song => {
                            const song_filename = song.fileName || song.src;
                            const isDaily = !!dailySongs[song_filename];
                            const isSaved = !!savedSongs[song_filename];
                            return (
                                <li key={song.src} className="song-item">
                                    <Link href={`/songList/${encodeURIComponent(song.src)}`} legacyBehavior>
                                        <a className='song-list-button'>{song.name}</a>
                                    </Link>
                                    <div className="song-actions">
                                        {isDaily ? (
                                            <button onClick={() => handleRemoveFromDaily(song)} className="song-action-btn done-btn active">Added!</button>
                                        ) : (
                                            <button onClick={() => handleSaveToDaily(song)} className="song-action-btn done-btn">Done</button>
                                        )}
                                        {isSaved ? (
                                            <button onClick={() => handleRemoveSavedSong(song)} className="song-action-btn save-btn active">Saved!</button>
                                        ) : (
                                            <button onClick={() => handleSaveSong(song)} className="song-action-btn save-btn">Save</button>
                                        )}
                                    </div>
                                </li>
                            );
                        })
                    )}
                </ul>
            </div>
            {loading && <LoadingOverlay />}
        </div>
    );
}

export default function SongListPage() {
    const [language, setLanguage] = React.useState('hindi');
    return (
        <div>
            <Navbar />
            <div className="language-tabs full-width">
                {['hindi', 'marathi', 'english'].map(lang => (
                    <button
                        key={lang}
                        className={`language-tab${language === lang ? ' active' : ''}`}
                        onClick={() => setLanguage(lang)}
                    >
                        {lang.charAt(0).toUpperCase() + lang.slice(1)}
                    </button>
                ))}
            </div>
            <Suspense fallback={<LoadingOverlay />}>
                <SongListContent language={language} setLanguage={setLanguage} />
            </Suspense>
        </div>
    );
}
