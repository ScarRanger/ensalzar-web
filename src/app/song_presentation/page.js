'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../components/supabaseClient';
import { songs } from '../songData';

function parseSlides(html) {
  if (!html) return [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return Array.from(doc.querySelectorAll('section')).map(
    (el) => el.outerHTML
  );
}

export default function SongPresentationPage() {
  const [selectedSong, setSelectedSong] = useState(null);
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [audienceWindow, setAudienceWindow] = useState(null);
  const [audienceReady, setAudienceReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');

  // Fetch song HTML from Supabase when a song is selected
  useEffect(() => {
    if (!selectedSong) return;
    setLoading(true);
    setFetchError('');
    setSlides([]);
    setCurrentSlide(0);

    async function fetchSongHtml() {
      const { data, error } = await supabase
        .storage
        .from('songs-html-files')
        .download(selectedSong.fileName);

      if (error) {
        setFetchError('Could not fetch song: ' + error.message);
        setLoading(false);
        return;
      }
      const text = await data.text();
      setSlides(parseSlides(text));
      setLoading(false);
    }

    fetchSongHtml();
  }, [selectedSong]);

  // Audience window handshake
  useEffect(() => {
    const handler = (event) => {
      if (event.data?.type === 'AUDIENCE_READY') {
        setAudienceReady(true);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  // Send slide to audience
  const sendSlideToAudience = useCallback(
    (slideIdx) => {
      if (audienceWindow && !audienceWindow.closed && audienceReady) {
        audienceWindow.postMessage(
          { type: 'UPDATE_SLIDE', content: slides[slideIdx] },
          window.location.origin
        );
      }
    },
    [audienceWindow, audienceReady, slides]
  );

  // Update audience on slide change
  useEffect(() => {
    if (audienceReady) sendSlideToAudience(currentSlide);
  }, [currentSlide, audienceReady, sendSlideToAudience]);

  // Open audience window
  const openAudience = () => {
    if (audienceWindow && !audienceWindow.closed) return;
    setAudienceReady(false);
    const win = window.open(
      '/audience_display',
      '_blank',
      'width=800,height=600,noopener,noreferrer'
    );
    if (win) setAudienceWindow(win);
  };

  // UI
  if (!selectedSong) {
    // Song list view
    return (
      <div className="p-8">
        <h1 className="text-3xl mb-6">Select a Song to Present</h1>
        <ul className="space-y-4">
          {songs.map((song) => (
            <li key={song.fileName}>
              <button
                className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
                onClick={() => setSelectedSong(song)}
              >
                {song.title}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  // Presenter view
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
      <header className="p-4 bg-gray-800 flex justify-between items-center">
        <h1 className="text-2xl font-bold">{selectedSong.title}</h1>
        <button
          className="px-4 py-2 bg-purple-600 rounded hover:bg-purple-700"
          onClick={openAudience}
        >
          {audienceWindow && !audienceWindow.closed
            ? 'Audience Window Open'
            : 'Open Audience Window'}
        </button>
      </header>
      <main className="flex flex-1 p-6 space-x-6">
        {/* Current Slide */}
        <section className="flex-1 bg-gray-800 rounded-lg p-6 shadow-xl flex flex-col">
          <h2 className="text-xl mb-4 text-blue-300">Current Slide</h2>
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-2xl">Loading...</div>
          ) : fetchError ? (
            <div className="flex-1 flex items-center justify-center text-red-400">{fetchError}</div>
          ) : (
            <div
              className="flex-1 bg-gray-700 p-4 rounded text-white text-lg"
              dangerouslySetInnerHTML={{ __html: slides[currentSlide] || '' }}
            />
          )}
          <div className="mt-4 flex justify-between">
            <button
              className="px-4 py-2 bg-blue-600 rounded disabled:opacity-50"
              onClick={() => setCurrentSlide((i) => Math.max(i - 1, 0))}
              disabled={currentSlide === 0}
            >
              &larr; Prev
            </button>
            <span>
              {slides.length ? `${currentSlide + 1} / ${slides.length}` : ''}
            </span>
            <button
              className="px-4 py-2 bg-blue-600 rounded disabled:opacity-50"
              onClick={() =>
                setCurrentSlide((i) => Math.min(i + 1, slides.length - 1))
              }
              disabled={currentSlide === slides.length - 1}
            >
              Next &rarr;
            </button>
          </div>
        </section>
        {/* Next Slide Preview */}
        <aside className="w-1/3 bg-gray-800 rounded-lg p-6 shadow-xl flex flex-col">
          <h2 className="text-xl mb-4 text-green-300">Next Slide</h2>
          <div
            className="flex-1 bg-gray-700 p-4 rounded text-gray-300 text-base"
            dangerouslySetInnerHTML={{
              __html: slides[currentSlide + 1] || '<p>End of song</p>',
            }}
          />
        </aside>
      </main>
      <footer className="p-4 bg-gray-800 text-center">
        <button
          className="px-4 py-2 bg-gray-600 rounded"
          onClick={() => setSelectedSong(null)}
        >
          Back to Song List
        </button>
      </footer>
    </div>
  );
}
