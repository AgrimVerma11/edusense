import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import Logo from './Logo';
import { event } from '../../lib/track';

const GITHUB_URL = 'https://github.com/AgrimVerma11';
const CONTACT_EMAIL = 'contact@firasa.agrimverma.dev';

// Brand icons kept as inline SVGs. lucide's brand glyphs are being retired, and
// this keeps the three social marks visually consistent.
function GithubIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

function LinkedinIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

function SubstackIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z" />
    </svg>
  );
}

const SOCIALS = [
  { label: 'GitHub', href: GITHUB_URL, icon: GithubIcon },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/agrimverma11', icon: LinkedinIcon },
  {
    label: 'Substack',
    href: 'https://substack.com/@agrimverma/posts?r=5rnu7p&utm_campaign=profile&utm_medium=profile-page',
    icon: SubstackIcon,
  },
];

const EXPLORE = [
  { to: '/', label: 'Home' },
  { to: '/assessment', label: 'Assessment' },
  { to: '/insights', label: 'Insights' },
  { to: '/about', label: 'About' },
  { to: '/name', label: 'Behind the name' },
];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 border-t border-ink-100 bg-white">
      <div className="container-page py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-2">
            <Logo />
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-500">
              A self-reflection tool that helps students read their own study habits and wellbeing
              patterns, and turn them into small, doable next steps.
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              onClick={() => event('contact_click')}
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-ink-600 transition-colors hover:text-brand-600"
            >
              <Mail size={16} className="text-brand-500" />
              {CONTACT_EMAIL}
            </a>
            <p className="mt-4 text-xs text-ink-400">No signup. Nothing stored.</p>
          </div>

          {/* Explore */}
          <div className="flex flex-col gap-2.5 text-sm">
            <span className="mb-1 font-semibold text-ink-900">Explore</span>
            {EXPLORE.map((item) => (
              <Link key={item.to} to={item.to} className="w-fit text-ink-500 hover:text-ink-900">
                {item.label}
              </Link>
            ))}
          </div>

          {/* Connect */}
          <div className="flex flex-col gap-2.5 text-sm">
            <span className="mb-1 font-semibold text-ink-900">Connect</span>
            {SOCIALS.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-fit items-center gap-2 text-ink-500 hover:text-brand-600"
              >
                <Icon />
                {label}
              </a>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-ink-100 pt-6">
          <p className="text-xs leading-relaxed text-ink-400">
            Firasa is a reflective aid, not a medical, psychological, or academic assessment, and
            it does not predict any individual grade. If you are feeling distressed, please reach out
            to your institution&apos;s counselling service.
          </p>
          <div className="mt-4 flex flex-col gap-3 text-xs text-ink-400 sm:flex-row sm:items-center sm:justify-between">
            <p>&copy; {year} Firasa. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link to="/privacy" className="hover:text-ink-700">
                Privacy
              </Link>
              <Link to="/terms" className="hover:text-ink-700">
                Terms
              </Link>
            </div>
            <p>
              Built by{' '}
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-ink-500 hover:text-brand-600"
              >
                Agrim Verma
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
