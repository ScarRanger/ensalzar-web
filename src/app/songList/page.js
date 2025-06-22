'use client';
import React from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import { songs } from '../songData';
import './songList.css';

export default function SongListPage() {
    return (
        <div>
            <Navbar />
            <div className="song-list-container">
                <div className="song-list-sidebar full-width">
                    <h2>Song List</h2>
                    <ul>
                        {songs.map(song => (
                            <li key={song.fileName}>
                                <Link href={`/songList/${encodeURIComponent(song.fileName)}`} legacyBehavior>
                                    <a className='song-list-button'>{song.title}</a>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}
