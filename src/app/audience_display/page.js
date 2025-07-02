'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import parse from 'html-react-parser';
import { extractSlidesFromHtml } from '../lib/splitSlides';
import { fetchSongData } from '../songData';
import LoadingOverlay from '../components/LoadingOverlay';

export default function AudiencePageWrapper() {
  return (
    <Suspense fallback={<LoadingOverlay />}>
      <AudiencePage />
    </Suspense>
  );
}

function AudiencePage() {
  const searchParams = useSearchParams();
  const slug = searchParams.get('slug');
  const [slides, setSlides] = useState([]);
  const [index, setIndex] = useState(0);
  const [songTitle, setSongTitle] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    setError('');
    const fetchSong = async () => {
      try {
        const data = await fetchSongData();
        const song = data.songs.find(s => (s.fileName || s.src) === slug || (s.name && s.name.replace(/\s+/g, '').toLowerCase() === slug.replace(/\s+/g, '').toLowerCase()));
        if (!song) throw new Error('Song not found');
        setSongTitle(song.name || slug);
        const src = song.src || song.fileName || slug;
        const url = `https://cgs-songs-config.s3.ap-south-1.amazonaws.com/${encodeURIComponent(src)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Could not fetch file');
        const html = await res.text();
        setSlides(extractSlidesFromHtml(html));
      } catch (err) {
        setError('Could not fetch file: ' + err.message);
      }
    };
    fetchSong();
  }, [slug]);

  useEffect(() => {
    if (!slug) return;

    const channel = new BroadcastChannel(`song-sync-${slug}`);
    channel.onmessage = (e) => {
      if (typeof e.data.index === 'number') {
        setIndex(e.data.index);
      }
    };

    return () => channel.close();
  }, [slug]);

  if (!slug) return <div>❌ No slug provided.</div>;
  if (error) return <div style={{color:'red'}}>{error}</div>;
  if (slides.length === 0) return <div>🎵 Waiting for presenter...</div>;

  return (
    <main className="bg-black text-white min-h-screen flex items-center justify-center p-8 text-center">
      <div className="text-2xl font-bold mb-4">{songTitle}</div>
      <div className="text-black bg-white p-10 text-4xl rounded-xl max-w-4xl w-full transition-all slide">
        {parse(slides[index])}
      </div>
    </main>
  );
}
