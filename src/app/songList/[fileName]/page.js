'use client';
import React, { useEffect, useState, use } from 'react';
import { supabase } from '../../components/supabaseClient';
import Navbar from '../../components/Navbar';
import { useZoom } from '../../components/ZoomContext';
import LoadingOverlay from '../../components/LoadingOverlay';
import '../songList.css';

export default function SongDetailPage({ params }) {
  const [html, setHtml] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { zoomLevel } = useZoom();
  const { fileName } = use(params);

  useEffect(() => {
    if (!fileName) return;
    setLoading(true);
    const fetchHtml = async () => {
      setHtml('');
      setError('');
      const { data, error } = await supabase
        .storage
        .from('songs-html-files')
        .download(decodeURIComponent(fileName));
      if (error) {
        setError('Could not fetch file: ' + error.message);
        setLoading(false);
        return;
      }
      const text = await data.text();
      setHtml(text);
      setLoading(false);
    };
    fetchHtml();
  }, [fileName]);

  return (
    <div>
      <Navbar />
      {loading && <LoadingOverlay />}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <div
        className="html-content-container"
        style={{ zoom: zoomLevel }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
} 