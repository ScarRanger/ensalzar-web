'use client';
import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../components/supabaseClient';
import { useUser } from '../components/useUser';
import LoadingOverlay from '../components/LoadingOverlay';
import Link from 'next/link';
import './savedSongs.css';

export default function SavedSongsPage() {
    const { user } = useUser();
    const [savedSongs, setSavedSongs] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user) {
            setSavedSongs([]);
            return;
        }
        setLoading(true);
        supabase
            .from('saved_songs')
            .select('song_filename, song_title')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .then(({ data, error }) => {
                if (error) console.error('Error fetching saved songs:', error);
                else setSavedSongs(data);
                setLoading(false);
            });
    }, [user]);

    const handleRemove = async (song_filename) => {
        if (!user) return;
        setLoading(true);
        const { error } = await supabase
            .from('saved_songs')
            .delete()
            .eq('user_id', user.id)
            .eq('song_filename', song_filename);
        
        if (error) {
            console.error('Error removing song:', error);
        } else {
            setSavedSongs(prev => prev.filter(s => s.song_filename !== song_filename));
        }
        setLoading(false);
    };

    return (
        <div>
            <Navbar />
            {loading && <LoadingOverlay />}
            <div className="saved-songs-container">
                <h1 className="saved-songs-title">Your Saved Songs</h1>
                {savedSongs.length === 0 ? (
                    <p className="no-songs-message">You haven&apos;t saved any songs yet.</p>
                ) : (
                    <ul className="saved-songs-list">
                        {savedSongs.map(song => (
                            <li key={song.song_filename} className="saved-song-item">
                                <Link href={`/songList/${encodeURIComponent(song.song_filename)}`} legacyBehavior>
                                    <a className="saved-song-link">{song.song_title}</a>
                                </Link>
                                <button onClick={() => handleRemove(song.song_filename)} className="remove-saved-btn">
                                    Remove
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
