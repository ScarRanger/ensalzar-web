'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './Navbar.css';
import { supabase } from './supabaseClient';
import { useZoom } from './ZoomContext';

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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setRegisterMode(false);
    const trimmedEmail = email.trim();
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setRegisterMode(true);
        setError('No account found. Would you like to register?');
      } else {
        setError(error.message);
      }
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

  return (
    <nav className="main-nav">
      <div className="nav-links">
        {navItems.map((item) => (
          <Link key={item.name} href={item.path} legacyBehavior>
            <a className="navbar-link">{item.name}</a>
          </Link>
        ))}
      </div>

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
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
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