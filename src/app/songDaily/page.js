'use client';
import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../components/supabaseClient';
import { useUser } from '../components/useUser';
import LoadingOverlay from '../components/LoadingOverlay';

export default function SongDailyPage() {
  const { user } = useUser();
  const [songsByDay, setSongsByDay] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from('daily_songs')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .then(({ data }) => {
        const grouped = {};
        data?.forEach(row => {
          if (!grouped[row.date]) grouped[row.date] = [];
          grouped[row.date].push({ ...row, song_filename: row.song_filename });
        });
        setSongsByDay(grouped);
        setLoading(false);
      });
  }, [user]);

  return (
    <div>
      <Navbar />
      {loading && <LoadingOverlay />}
      <div className="p-8">
        <h1 className="text-2xl mb-4">Your Daily Songs</h1>
        {Object.keys(songsByDay).length === 0 && <p>No songs selected yet.</p>}
        {Object.entries(songsByDay).map(([date, songs]) => (
          <div key={date} className="mb-6">
            <h2 className="text-xl font-bold mb-2">{date}</h2>
            <ul className="list-disc pl-6">
              {songs.map(song => (
                <li key={song.song_filename}>{song.song_title}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
