import { Link } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';
import Button from '../components/ui/Button';
import { usePageMeta } from '../lib/usePageMeta';

export default function NotFound() {
  usePageMeta({
    title: 'Page not found | Firasa',
    description: 'That page could not be found.',
    noindex: true,
  });

  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <p className="text-7xl font-bold tracking-tight text-brand-200">404</p>
      <h1 className="mt-4 text-2xl font-bold text-ink-900">This page wandered off.</h1>
      <p className="mt-2 max-w-md text-ink-500">
        The link may be old or mistyped. Let us get you back to somewhere useful.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button as={Link} to="/">
          <Home size={18} /> Back home
        </Button>
        <Button as={Link} to="/assessment" variant="secondary">
          <Compass size={18} /> Start the reading
        </Button>
      </div>
    </div>
  );
}
