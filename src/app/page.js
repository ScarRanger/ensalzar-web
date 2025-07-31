import Image from "next/image";
import Navbar from "./components/Navbar";
import Link from "next/link";

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e3eafc 0%, #f8faff 100%)', fontFamily: 'Inter, sans-serif' }}>
      <Navbar />
      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '2rem' }}>
        <div style={{ textAlign: 'center', maxWidth: 600 }}>
          <h1 style={{ fontSize: '2.8rem', fontWeight: 800, color: '#1976d2', marginBottom: '1rem', letterSpacing: '-1px' }}>Welcome to Ensalzar</h1>
          <p style={{ fontSize: '1.25rem', color: '#333', marginBottom: '2rem', lineHeight: 1.5 }}>
            Discover, save, and present songs with beautiful chord sheets. Ensalzar makes it easy to manage your worship music, share with your audience, and keep your favorites organized.
          </p>
          <Link href="/songList" passHref legacyBehavior>
            <a style={{ display: 'inline-block', padding: '0.9em 2.2em', fontSize: '1.2em', fontWeight: 700, color: '#fff', background: '#1976d2', borderRadius: 8, boxShadow: '0 2px 8px rgba(25, 118, 210, 0.12)', textDecoration: 'none', transition: 'background 0.2s', marginBottom: '1.5rem' }}>Browse Songs</a>
          </Link>
        </div>
      </main>
    </div>
  );
}
