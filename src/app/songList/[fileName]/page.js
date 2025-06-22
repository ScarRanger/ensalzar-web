'use client';
import React, { useEffect, useState, use } from 'react';
import { supabase } from '../../components/supabaseClient';
import Navbar from '../../components/Navbar';
import { useZoom } from '../../components/ZoomContext';
import '../songList.css';

export default function SongDetailPage({ params }) {
  const [html, setHtml] = useState('');
  const [error, setError] = useState('');
  const { zoomLevel } = useZoom();
  const { fileName } = use(params);

  useEffect(() => {
    if (!fileName) return;

    const fetchHtml = async () => {
      setHtml('');
      setError('');

      const { data, error } = await supabase
        .storage
        .from('songs-html-files')
        .download(decodeURIComponent(fileName));

      if (error) {
        setError('Could not fetch file: ' + error.message);
        return;
      }

      const text = await data.text();
      setHtml(text);
    };

    fetchHtml();
  }, [fileName]);

  return (
    <div>
      <Navbar />
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <div
        className="html-content-container"
        style={{ zoom: zoomLevel }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
} 