import React, { useRef, useState } from 'react';
import './LanguageTabs.css';

const LANGUAGES = [
  { key: 'marathi', label: 'Marathi' },
  { key: 'hindi', label: 'Hindi' },
  { key: 'english', label: 'English' },
];

export default function LanguageTabs({ language, setLanguage, swiping }) {
  const [tabRects, setTabRects] = useState([null, null, null]);
  const tabRefs = [useRef(), useRef(), useRef()];

  // Swipe gesture state (handled by parent now)
  // For animated underline
  React.useEffect(() => {
    setTabRects(tabRefs.map(ref => ref.current?.getBoundingClientRect() || null));
    // Recalculate on window resize
    const handleResize = () => setTabRects(tabRefs.map(ref => ref.current?.getBoundingClientRect() || null));
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [language]);

  const activeIdx = LANGUAGES.findIndex(l => l.key === language);

  return (
    <div
      className={`language-tabs-material${swiping ? ' swiping' : ''}`}
    >
      {LANGUAGES.map((lang, idx) => (
        <button
          key={lang.key}
          ref={tabRefs[idx]}
          className={`language-tab-material${language === lang.key ? ' active' : ''}${swiping && language === lang.key ? ' swiping' : ''}`}
          onClick={() => setLanguage(lang.key)}
        >
          {lang.label}
        </button>
      ))}
      {/* Animated underline */}
      <div
        className={`language-tab-underline${swiping ? ' swiping' : ''}`}
        style={(() => {
          const rect = tabRects[activeIdx];
          if (!rect) return { opacity: 0 };
          const parentRect = tabRefs[0].current?.parentNode?.getBoundingClientRect();
          if (!parentRect) return { opacity: 0 };
          const left = rect.left - parentRect.left;
          return {
            width: rect.width,
            left,
            opacity: 1,
          };
        })()}
      />
    </div>
  );
} 