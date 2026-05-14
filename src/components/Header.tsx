import { useState, useEffect, useRef } from 'react';
import { Shield, Menu, X, BookOpen, ChevronRight } from 'lucide-react';

const navLinks = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Cómo Funciona', href: '#como-funciona' },
  { label: 'Inteligencia Artificial', href: '#ia' },
  { label: 'Red BioSafe', href: '#red' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('');
  const [mounted, setMounted] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMounted(true);
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&family=Instrument+Serif:ital@0;1&display=swap');

        .biosafe-header {
          font-family: 'DM Sans', sans-serif;
        }

        /* Logo entrance */
        @keyframes logoSlide {
          from { opacity: 0; transform: translateX(-18px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        /* Nav links stagger */
        @keyframes navFade {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* CTA entrance */
        @keyframes ctaSlide {
          from { opacity: 0; transform: translateX(18px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        /* Shield pulse */
        @keyframes shieldPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(114,110,151,0.35); }
          50%       { box-shadow: 0 0 0 7px rgba(114,110,151,0); }
        }

        /* Mobile drawer slide-down */
        @keyframes drawerOpen {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Underline hover */
        .nav-link-item {
          position: relative;
          color: #6b7280;
          font-size: 0.8125rem;
          font-weight: 400;
          letter-spacing: 0.02em;
          transition: color 0.22s ease;
          padding-bottom: 2px;
          text-decoration: none;
        }
        .nav-link-item::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 1.5px;
          background: linear-gradient(90deg, #726E97, #7698B3);
          border-radius: 2px;
          transition: width 0.28s cubic-bezier(0.4,0,0.2,1);
        }
        .nav-link-item:hover { color: #1f2937; }
        .nav-link-item:hover::after { width: 100%; }
        .nav-link-item.active { color: #726E97; }
        .nav-link-item.active::after { width: 100%; }

        /* CTA glow button */
        .cta-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.5rem 1.1rem;
          border-radius: 10px;
          font-size: 0.8rem;
          font-weight: 500;
          color: #fff;
          background: linear-gradient(135deg, #5c4d8a 0%, #7263b0 50%, #6b5ea8 100%);
          letter-spacing: 0.01em;
          text-decoration: none;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
          box-shadow: 0 2px 10px rgba(92,77,138,0.25);
          overflow: hidden;
        }
        .cta-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #6b5ea8, #4e3f7a);
          opacity: 0;
          transition: opacity 0.18s ease;
          border-radius: inherit;
        }
        .cta-btn:hover { 
          transform: translateY(-1.5px);
          box-shadow: 0 5px 22px rgba(92,77,138,0.4), 0 0 0 1px rgba(114,110,151,0.2);
        }
        .cta-btn:hover::before { opacity: 1; }
        .cta-btn > * { position: relative; z-index: 1; }
        .cta-btn:active { transform: translateY(0); }

        /* Chevron micro-animation */
        .cta-chevron {
          transition: transform 0.2s ease;
          opacity: 0.7;
        }
        .cta-btn:hover .cta-chevron {
          transform: translateX(3px);
          opacity: 1;
        }

        /* Logo icon */
        .logo-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #726E97, #7698B3);
          transition: transform 0.22s ease;
        }
        .logo-icon:hover { animation: shieldPulse 1s ease-out; }

        /* Logo word */
        .logo-word {
          font-family: 'DM Sans', sans-serif;
          font-size: 1.15rem;
          font-weight: 600;
          letter-spacing: -0.01em;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: opacity 0.2s ease;
        }
        .logo-word:hover { opacity: 0.88; }

        /* Separator dot in logo */
        .logo-dot {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: #7698B3;
          margin-top: 1px;
        }

        /* Animated mount: stagger */
        .mounted .logo-animate {
          animation: logoSlide 0.45s cubic-bezier(0.4,0,0.2,1) both;
        }
        .mounted .nav-animate-1 { animation: navFade 0.4s 0.08s cubic-bezier(0.4,0,0.2,1) both; }
        .mounted .nav-animate-2 { animation: navFade 0.4s 0.14s cubic-bezier(0.4,0,0.2,1) both; }
        .mounted .nav-animate-3 { animation: navFade 0.4s 0.20s cubic-bezier(0.4,0,0.2,1) both; }
        .mounted .nav-animate-4 { animation: navFade 0.4s 0.26s cubic-bezier(0.4,0,0.2,1) both; }
        .mounted .cta-animate  {
          animation: ctaSlide 0.45s 0.3s cubic-bezier(0.4,0,0.2,1) both;
        }

        /* Mobile drawer */
        .mobile-drawer {
          animation: drawerOpen 0.28s cubic-bezier(0.4,0,0.2,1) both;
        }

        /* Mobile link row */
        .mobile-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 0;
          color: #374151;
          font-size: 0.875rem;
          font-weight: 400;
          text-decoration: none;
          border-bottom: 1px solid #f3f4f6;
          transition: color 0.18s ease, padding-left 0.18s ease;
        }
        .mobile-link:last-of-type { border-bottom: none; }
        .mobile-link:hover { color: #726E97; padding-left: 4px; }

        /* Subtle divider line in desktop */
        .nav-divider {
          width: 1px;
          height: 18px;
          background: #e5e7eb;
          margin: 0 6px;
        }

        /* Pill tag on CTA */
        .cta-badge {
          display: inline-flex;
          align-items: center;
          font-size: 0.65rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.75);
          background: rgba(255,255,255,0.12);
          border-radius: 100px;
          padding: 1px 6px;
          margin-left: 2px;
        }
      `}</style>

      <header
        ref={headerRef}
        className={`biosafe-header fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${mounted ? 'mounted' : ''} ${
          scrolled
            ? 'bg-white/98 shadow-[0_1px_20px_rgba(0,0,0,0.07)] backdrop-blur-md'
            : 'bg-white/90 backdrop-blur-sm'
        }`}
      >
        {/* Thin top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: 'linear-gradient(90deg, #726E97 0%, #7698B3 50%, #5c4d8a 100%)' }}
        />

        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-[62px] flex items-center justify-between">

          {/* ── Logo ── */}
          <a href="#inicio" className="logo-word logo-animate">
            
            <span style={{ color: '#726E97' }}>Bio</span>
            <span style={{ color: '#7698B3' }}>Safe</span>
          </a>

          {/* ── Desktop Nav ── */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link, i) => (
              <a
                key={link.href}
                href={link.href}
                className={`nav-link-item nav-animate-${i + 1} ${activeLink === link.href ? 'active' : ''}`}
                onClick={() => setActiveLink(link.href)}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* ── CTA + Hamburger ── */}
          <div className="flex items-center gap-3">
            {/* Desktop CTA */}
            

            {/* Hamburger */}
            <button
              className="md:hidden relative w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-50 hover:text-gray-800 transition-all duration-200"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <span
                className="absolute transition-all duration-200"
                style={{ opacity: menuOpen ? 0 : 1, transform: menuOpen ? 'rotate(90deg) scale(0.5)' : 'rotate(0deg) scale(1)' }}
              >
                <Menu className="w-5 h-5" />
              </span>
              <span
                className="absolute transition-all duration-200"
                style={{ opacity: menuOpen ? 1 : 0, transform: menuOpen ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0.5)' }}
              >
                <X className="w-5 h-5" />
              </span>
            </button>
          </div>
        </div>

        {/* ── Mobile Drawer ── */}
        {menuOpen && (
          <div className="md:hidden mobile-drawer bg-white border-t border-gray-100/80 shadow-lg">
            <div className="max-w-7xl mx-auto px-6 pt-2 pb-5">

              {/* Nav links */}
              <div className="mb-4">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="mobile-link"
                    onClick={() => setMenuOpen(false)}
                  >
                    {link.label}
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300" strokeWidth={2} />
                  </a>
                ))}
              </div>

              {/* Mobile CTA */}
              <a
                href="#modulo-educativo"
                className="cta-btn w-full justify-center py-3 text-sm"
                onClick={() => setMenuOpen(false)}
              >
                <BookOpen className="w-4 h-4" strokeWidth={2} />
                Módulo Educativo para Padres
                <ChevronRight className="cta-chevron w-3.5 h-3.5 ml-auto" strokeWidth={2.5} />
              </a>
            </div>
          </div>
        )}
      </header>
    </>
  );
}