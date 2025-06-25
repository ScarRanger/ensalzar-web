'use client';
import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navbar from '../components/Navbar';
import { songs } from '../songData';
import { supabase } from '../components/supabaseClient';
import { useUser } from '../components/useUser';
import LoadingOverlay from '../components/LoadingOverlay';
import './songList.css';

function SongListContent() {
    const searchParams = useSearchParams();
    const category = searchParams.get('category');
    const filteredSongs = category ? songs.filter(song => song.category === category) : songs;
    const { user } = useUser();
    const [dailySongs, setDailySongs] = useState({});
    const [savedSongs, setSavedSongs] = useState({});
    const [loading, setLoading] = useState(false);

    const today = new Date().toISOString().slice(0, 10);

    useEffect(() => {
        if (!user) {
            setDailySongs({});
            setSavedSongs({});
            return;
        }
        setLoading(true);
        Promise.all([
            supabase.from('daily_songs').select('song_filename').eq('user_id', user.id).eq('date', today),
            supabase.from('saved_songs').select('song_filename').eq('user_id', user.id)
        ]).then(([{ data: dailyData }, { data: savedData }]) => {
            const dailyMap = {};
            dailyData?.forEach(row => { dailyMap[row.song_filename] = true; });
            setDailySongs(dailyMap);

            const savedMap = {};
            savedData?.forEach(row => { savedMap[row.song_filename] = true; });
            setSavedSongs(savedMap);
            setLoading(false);
        });
    }, [user, today]);

    const handleSaveToDaily = async (song) => {
        if (!user) return alert('Please log in.');
        setLoading(true);
        const { error } = await supabase.from('daily_songs').insert({
            user_id: user.id,
            date: today,
            song_filename: song.fileName,
            song_title: song.title,
        });
        if (error) console.error('Error saving to daily:', error);
        else setDailySongs(prev => ({ ...prev, [song.fileName]: true }));
        setLoading(false);
    };

    const handleRemoveFromDaily = async (song) => {
        if (!user) return;
        setLoading(true);
        const { error } = await supabase.from('daily_songs').delete()
            .eq('user_id', user.id)
            .eq('date', today)
            .eq('song_filename', song.fileName);
        if (error) console.error('Error removing from daily:', error);
        else setDailySongs(prev => {
            const newDaily = { ...prev };
            delete newDaily[song.fileName];
            return newDaily;
        });
        setLoading(false);
    };

    const handleSaveSong = async (song) => {
        if (!user) return alert('Please log in.');
        setLoading(true);
        const { error } = await supabase.from('saved_songs').insert({
            user_id: user.id,
            song_filename: song.fileName,
            song_title: song.title,
        });
        if (error) console.error('Error saving song:', error);
        else setSavedSongs(prev => ({ ...prev, [song.fileName]: true }));
        setLoading(false);
    };

    const handleRemoveSavedSong = async (song) => {
        if (!user) return;
        setLoading(true);
        const { error } = await supabase.from('saved_songs').delete()
            .eq('user_id', user.id)
            .eq('song_filename', song.fileName);
        if (error) console.error('Error removing saved song:', error);
        else setSavedSongs(prev => {
            const newSaved = { ...prev };
            delete newSaved[song.fileName];
            return newSaved;
        });
        setLoading(false);
    };

    return (
        <div className="song-list-container">
            <div className="song-list-sidebar full-width">
                <h2>{category ? `${category} Songs` : 'Song List'}</h2>
                <ul>
                    {filteredSongs.length === 0 ? (
                        <li style={{ textAlign: 'center', color: '#888', width: '100%' }}>No songs found.</li>
                    ) : (
                        filteredSongs.map(song => (
                            <li key={song.fileName} className="song-item">
                                <Link href={`/songList/${encodeURIComponent(song.fileName)}`} legacyBehavior>
                                    <a className='song-list-button'>{song.title}</a>
                                </Link>
                                <div className="song-actions">
                                    {dailySongs[song.fileName] ? (
                                        <button onClick={() => handleRemoveFromDaily(song)} className="song-action-btn remove-btn">Done</button>
                                    ) : (
                                        <button onClick={() => handleSaveToDaily(song)} className="song-action-btn done-btn">Done</button>
                                    )}
                                    {savedSongs[song.fileName] ? (
                                        <button onClick={() => handleRemoveSavedSong(song)} className="song-action-btn remove-btn">Saved</button>
                                    ) : (
                                        <button onClick={() => handleSaveSong(song)} className="song-action-btn save-btn">Save</button>
                                    )}
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>
            {loading && <LoadingOverlay />}
        </div>
    );
}

export default function SongListPage() {
    return (
        <div>
            <Navbar />
            <Suspense fallback={<LoadingOverlay />}>
                <SongListContent />
            </Suspense>
        </div>
    );
}
