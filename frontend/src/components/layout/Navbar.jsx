import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from './Logo';
import Button from '../ui/Button';
import { useAssessment } from '../../context/AssessmentContext';
import { cn } from '../../lib/cn';
import { event } from '../../lib/track';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { result } = useAssessment();

  // "Your results" only appears once there is a result to go back to, which is
  // how a student returns to it after clicking away.
  const links = [
    { to: '/', label: 'Home', end: true },
    ...(result ? [{ to: '/results', label: 'Your results', live: true }] : []),
    { to: '/insights', label: 'Insights' },
    { to: '/about', label: 'About' },
    { to: '/name', label: 'The name' },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/80 backdrop-blur-md">
      <nav className="container-page flex h-16 items-center justify-between">
        <Link to="/" className="rounded-lg" aria-label="Firasa home">
          <Logo />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'text-brand-700' : 'text-ink-500 hover:text-ink-900'
                )
              }
            >
              {link.live && <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />}
              {link.label}
            </NavLink>
          ))}
          <Button
            as={Link}
            to="/assessment"
            size="sm"
            className="ml-2"
            onClick={() => event('start_reading', { from: 'nav', retake: Boolean(result) })}
          >
            {result ? 'Retake the reading' : 'Start the reading'}
          </Button>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-ink-600 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-ink-100 bg-white md:hidden">
          <div className="container-page flex flex-col gap-1 py-3">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium',
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50'
                  )
                }
              >
                {link.live && <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />}
                {link.label}
              </NavLink>
            ))}
            <Button
              as={Link}
              to="/assessment"
              onClick={() => {
                setOpen(false);
                event('start_reading', { from: 'nav_mobile', retake: Boolean(result) });
              }}
              className="mt-1"
            >
              {result ? 'Retake the reading' : 'Start the reading'}
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
