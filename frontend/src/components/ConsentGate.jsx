import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Check } from 'lucide-react';
import Button from './ui/Button';
import { cn } from '../lib/cn';

const POINTS = [
  'This is a self-reflection tool, not a diagnosis or a prediction of your grades.',
  'Your answers are used once to generate your result and are never stored on our servers.',
  'They stay in your browser for this visit only and are cleared when you close the tab.',
];

// Shown once per session before the questionnaire. The student has to actively
// acknowledge what Firasa is (and is not) before starting, which keeps the
// tool honest about its limits and gives clear, informed consent.
export default function ConsentGate({ onAccept }) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <div className="card w-full max-w-xl p-7 sm:p-9">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <ShieldCheck size={24} />
        </span>
        <h1 className="mt-5 text-2xl font-bold tracking-tight text-ink-900">Before you begin</h1>
        <p className="mt-2 text-ink-500">
          A quick note on what this is, so your reflection lands the right way.
        </p>

        <ul className="mt-6 space-y-3">
          {POINTS.map((point) => (
            <li key={point} className="flex gap-3 text-sm leading-relaxed text-ink-600">
              <Check size={18} className="mt-0.5 shrink-0 text-brand-600" />
              <span>{point}</span>
            </li>
          ))}
        </ul>

        <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-ink-200 p-4 transition-colors hover:border-brand-300">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-brand-600"
          />
          <span className="text-sm text-ink-700">
            I understand Firasa is a self-reflection tool, not a diagnosis or a grade prediction.
          </span>
        </label>

        <Button
          onClick={onAccept}
          disabled={!checked}
          size="lg"
          className={cn('mt-6 w-full', !checked && 'opacity-60')}
        >
          Begin the reading
        </Button>

        <p className="mt-4 text-center text-xs text-ink-400">
          Read our{' '}
          <Link to="/privacy" className="underline hover:text-ink-600">
            privacy note
          </Link>{' '}
          and{' '}
          <Link to="/terms" className="underline hover:text-ink-600">
            terms
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
