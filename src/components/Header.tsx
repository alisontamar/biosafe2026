import { useState, useEffect } from 'react';
import { Menu, X, BookOpen, ChevronRight } from 'lucide-react';

const navLinks = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Cómo Funciona', href: '#como-funciona' },
  { label: 'Inteligencia Artificial', href: '#ia' },
  { label: 'Red BioSafe', href: '#red' },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

        .biosafe-header {
          font-family: 'DM Sans', sans-serif;
        }

        @keyframes logoSlide {
          from { opacity: 0; transform: translateX(-18px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes navFade {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes drawerOpen {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .mounted .logo-animate {
          animation: logoSlide 0.45s cubic-bezier(0.4,0,0.2,1) both;
        }

        .mounted .nav-animate-1 {
          animation: navFade 0.4s 0.08s cubic-bezier(0.4,0,0.2,1) both;
        }

        .mounted .nav-animate-2 {
          animation: navFade 0.4s 0.14s cubic-bezier(0.4,0,0.2,1) both;
        }

        .mounted .nav-animate-3 {
          animation: navFade 0.4s 0.20s cubic-bezier(0.4,0,0.2,1) both;
        }

        .mounted .nav-animate-4 {
          animation: navFade 0.4s 0.26s cubic-bezier(0.4,0,0.2,1) both;
        }

        .logo-word {
          font-family: 'DM Sans', sans-serif;
          font-size: 1.15rem;
          font-weight: 700;
          letter-spacing: -0.03em;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 2px;
          transition: transform 0.2s ease, opacity 0.2s ease;
        }

        .logo-word:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .nav-link-item {
          position: relative;
          color: #4b5563;
          font-size: 0.82rem;
          font-weight: 500;
          letter-spacing: 0.01em;
          transition: color 0.22s ease;
          padding-bottom: 3px;
          text-decoration: none;
        }

        .nav-link-item::after {
          content: '';
          position: absolute;
          bottom: -3px;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, #726E97, #7698B3);
          border-radius: 999px;
          transition: width 0.28s cubic-bezier(0.4,0,0.2,1);
        }

        .nav-link-item:hover {
          color: #726E97;
        }

        .nav-link-item:hover::after,
        .nav-link-item.active::after {
          width: 100%;
        }

        .nav-link-item.active {
          color: #726E97;
        }

        .mobile-drawer {
          animation: drawerOpen 0.28s cubic-bezier(0.4,0,0.2,1) both;
        }

        .mobile-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.9rem 0;
          color: #374151;
          font-size: 0.9rem;
          font-weight: 500;
          text-decoration: none;
          border-bottom: 1px solid rgba(229, 231, 235, 0.7);
          transition: color 0.18s ease, padding-left 0.18s ease;
        }

        .mobile-link:last-of-type {
          border-bottom: none;
        }

        .mobile-link:hover {
          color: #726E97;
          padding-left: 4px;
        }

        .cta-btn {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.75rem 1rem;
          border-radius: 14px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #fff;
          background: linear-gradient(135deg, #726E97, #7698B3);
          text-decoration: none;
          transition: transform 0.18s ease, box-shadow 0.18s ease;
          box-shadow: 0 8px 25px rgba(114, 110, 151, 0.26);
          overflow: hidden;
        }

        .cta-btn:hover {
          transform: translateY(-1.5px);
          box-shadow: 0 12px 32px rgba(114, 110, 151, 0.34);
        }

        .cta-chevron {
          transition: transform 0.2s ease;
          opacity: 0.85;
        }

        .cta-btn:hover .cta-chevron {
          transform: translateX(3px);
          opacity: 1;
        }

        @media (max-width: 768px) {
          .logo-word {
            font-size: 1.05rem;
          }
        }
      `}</style>

      <header
        className={`biosafe-header fixed top-0 left-0 right-0 z-50 bg-transparent transition-all duration-300 ${
          mounted ? 'mounted' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 pt-3">
          <div className="h-[58px] flex items-center justify-between rounded-2xl border border-white/35 bg-white/20 backdrop-blur-xl shadow-[0_8px_30px_rgba(31,41,55,0.08)] px-4 sm:px-5">

            {/* Logo */}
            <a href="#inicio" className="logo-word logo-animate">
              <span style={{ color: '#726E97' }}>Bio</span>
              <span style={{ color: '#7698B3' }}>Safe</span>
            </a>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
              {navLinks.map((link, i) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`nav-link-item nav-animate-${i + 1} ${
                    activeLink === link.href ? 'active' : ''
                  }`}
                  onClick={() => setActiveLink(link.href)}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Mobile Button */}
            <div className="flex items-center gap-3">
              <button
                className="md:hidden relative w-9 h-9 flex items-center justify-center rounded-xl text-gray-600 hover:bg-white/40 hover:text-gray-900 transition-all duration-200"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Abrir menú"
              >
                <span
                  className="absolute transition-all duration-200"
                  style={{
                    opacity: menuOpen ? 0 : 1,
                    transform: menuOpen
                      ? 'rotate(90deg) scale(0.5)'
                      : 'rotate(0deg) scale(1)',
                  }}
                >
                  <Menu className="w-5 h-5" />
                </span>

                <span
                  className="absolute transition-all duration-200"
                  style={{
                    opacity: menuOpen ? 1 : 0,
                    transform: menuOpen
                      ? 'rotate(0deg) scale(1)'
                      : 'rotate(-90deg) scale(0.5)',
                  }}
                >
                  <X className="w-5 h-5" />
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Drawer */}
        {menuOpen && (
          <div className="md:hidden mx-4 mt-2 rounded-2xl border border-white/35 bg-white/80 backdrop-blur-xl shadow-[0_12px_35px_rgba(31,41,55,0.12)] mobile-drawer">
            <div className="px-5 pt-2 pb-5">
              <div className="mb-4">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="mobile-link"
                    onClick={() => {
                      setActiveLink(link.href);
                      setMenuOpen(false);
                    }}
                  >
                    {link.label}
                    <ChevronRight
                      className="w-3.5 h-3.5 text-gray-400"
                      strokeWidth={2}
                    />
                  </a>
                ))}
              </div>

              <a
                href="#modulo-educativo"
                className="cta-btn w-full justify-center"
                onClick={() => setMenuOpen(false)}
              >
                <BookOpen className="w-4 h-4" strokeWidth={2} />
                Módulo Educativo para Padres
                <ChevronRight
                  className="cta-chevron w-3.5 h-3.5 ml-auto"
                  strokeWidth={2.5}
                />
              </a>
            </div>
          </div>
        )}
      </header>
    </>
  );
}