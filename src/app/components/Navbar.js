'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './Navbar.css';
import { supabase } from './supabaseClient';
import { useZoom } from './ZoomContext';
import { fetchSongData } from '../songData';

const navItems = [
  // { name: 'Home', path: '/' },
  { name: 'Daily Songs', path: '/songDaily' },
  { name: 'Saved Songs', path: '/savedSongs' }, 
  { name: 'Song List', path: '/songList' },
  { name: 'Song Category', path: '/songCategory' },
  // { name: 'Presentation', path: '/song_presentation' },

];

const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const Navbar = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [registerMode, setRegisterMode] = useState(false);
  const pathname = usePathname();
  const zoomContext = useZoom();
  const [search, setSearch] = useState('');
  const [allSongs, setAllSongs] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const isSongDetailPage = pathname.startsWith('/songList/') && pathname.length > '/songList'.length + 1;

  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (!error) setProfile(data);
    else setProfile(null);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) fetchProfile(session.user.id);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    fetchSongData().then(data => setAllSongs(data.songs || []));
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    const q = search.trim().toLowerCase();
    const results = allSongs.filter(song =>
      (song.title && song.title.toLowerCase().includes(q)) ||
      (Array.isArray(song.tags) && song.tags.some(tag => tag.toLowerCase().includes(q))) ||
      (song.category && song.category.toLowerCase().includes(q))
    );
    setSearchResults(results);
    setShowDropdown(true);
  }, [search, allSongs]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    const trimmedEmail = email.trim();
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
    if (error) {
      setError(error.message);
    } else {
      setShowLogin(false);
      setEmail('');
      setPassword('');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    const trimmedEmail = email.trim();
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    // Sign up with email confirmation disabled (handled in Supabase dashboard)
    const { data, error: signUpError } = await supabase.auth.signUp({ email: trimmedEmail, password, options: { emailRedirectTo: undefined } });
    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    let userId = data.user?.id;
    // If session is not returned, sign in immediately
    if (!data.session && !userId) {
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
      if (loginError) {
        setError(loginError.message);
        return;
      }
      userId = loginData.user?.id;
    }
    if (userId) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert([{ id: userId, username, email: trimmedEmail }], { onConflict: 'id' });
      if (profileError) {
        setError(profileError.message);
        return;
      }
    }
    setShowLogin(false);
    setEmail('');
    setPassword('');
    setUsername('');
    setRegisterMode(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleResultClick = (song) => {
    setSearch('');
    setShowDropdown(false);
    window.location.href = `/songList/${encodeURIComponent(song.fileName || song.src)}`;
  };

  return (
    <nav className="main-nav">
      <div className="nav-links">
        {navItems.map((item) => (
          <Link key={item.name} href={item.path} legacyBehavior>
            <a className="navbar-link">{item.name}</a>
          </Link>
        ))}
      </div>

      <form className="navbar-search" onSubmit={e => e.preventDefault()} style={{ display: 'flex', alignItems: 'center', marginRight: '1rem', position: 'relative' }}>
        <input
          type="text"
          placeholder="Search songs..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="navbar-search-input"
          style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', marginRight: '0.5rem', minWidth: 200 }}
          onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
        />
        <button type="submit" className="navbar-btn" style={{ padding: '0.5rem 1rem' }}>Search</button>
        {showDropdown && searchResults.length > 0 && (
          <div className="navbar-search-dropdown" style={{ position: 'absolute', top: '110%', left: 0, right: 0, background: '#fff', border: '1px solid #ccc', borderRadius: 4, zIndex: 100, maxHeight: 300, overflowY: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            {searchResults.map(song => (
              <div
                key={song.fileName || song.src}
                className="navbar-search-result"
                style={{ padding: '0.5rem 1rem', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                onMouseDown={() => handleResultClick(song)}
              >
                <div style={{ fontWeight: 500 }}>{song.title || song.name}</div>
                <div style={{ fontSize: '0.9em', color: '#1976d2' }}>{(song.tags && song.tags.join(', ')) || song.category}</div>
              </div>
            ))}
          </div>
        )}
      </form>

      {isSongDetailPage && (
        <div className="zoom-controls">
          <button onClick={zoomContext.zoomOut} className="navbar-btn zoom-btn">-</button>
          <span className="zoom-display">{Math.round(zoomContext.zoomLevel * 100)}%</span>
          <button onClick={zoomContext.zoomIn} className="navbar-btn zoom-btn">+</button>
        </div>
      )}

      <div className="nav-auth">
        {user ? (
          <>
            <span style={{ marginRight: '1rem' }}>
              {profile?.username ? profile.username : user.email}
            </span>
            <button onClick={handleLogout} className="navbar-btn">Logout</button>
          </>
        ) : (
          <>
            <button onClick={() => { setShowLogin(!showLogin); setError(''); setRegisterMode(false); }} className="navbar-btn">Login</button>
            {showLogin && (
              <div className="login-modal-bg">
                <div className="login-modal">
                  <form onSubmit={registerMode ? handleRegister : handleLogin}>
                    <div className="login-title">{registerMode ? 'Register' : 'Login'}</div>
                    <div className="login-field">
                      <label>Email</label>
                      <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="login-field">
                      <label>Password</label>
                      <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    {registerMode && (
                      <div className="login-field">
                        <label>Username</label>
                        <input
                          type="text"
                          placeholder="Username"
                          value={username}
                          onChange={e => setUsername(e.target.value)}
                          required
                        />
                      </div>
                    )}
                    {error && <div className="login-error">{error}</div>}
                    <div style={{ textAlign: 'center', margin: '1rem 0' }}>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setRegisterMode(!registerMode);
                          setError('');
                        }}
                        style={{ color: '#007bff', cursor: 'pointer', textDecoration: 'none' }}
                      >
                        {registerMode
                          ? 'Already have an account? Login'
                          : "Don't have an account? Register"}
                      </a>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button type="button" className="navbar-btn" onClick={() => setShowLogin(false)}>Cancel</button>
                      <button type="submit" className="navbar-btn">{registerMode ? 'Register' : 'Login'}</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 