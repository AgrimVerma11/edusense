import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { usePageMeta } from '../lib/usePageMeta';

function Section({ title, children }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-ink-600">{children}</div>
    </section>
  );
}

export default function Privacy() {
  usePageMeta({
    title: 'Privacy | Firasa',
    description:
      'Firasa collects no personal information, stores no answers on its servers, and sets no tracking cookies. Exactly how your data is handled.',
    path: '/privacy',
  });

  return (
    <div className="container-page max-w-3xl py-14">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <ShieldCheck size={20} />
      </span>
      <h1 className="mt-5 text-3xl font-bold tracking-tight text-ink-900">Privacy</h1>
      <p className="mt-2 text-sm text-ink-400">Last updated: July 2026</p>

      <div className="mt-6 rounded-xl bg-brand-50 p-5 text-sm leading-relaxed text-brand-900">
        The short version: Firasa collects no personal information, does not store your answers on
        its servers, and uses no tracking cookies. It is built to know as little about you as
        possible.
      </div>

      <Section title="What we collect, and what we do not">
        <p>
          You are never asked for your name, email, roll number, or any other identifying detail.
          The only information involved is the answers you give in the assessment, which describe
          study habits and wellbeing patterns, not who you are.
        </p>
      </Section>

      <Section title="How your answers are handled">
        <p>
          When you submit the assessment, your answers are sent once, over an encrypted connection,
          to generate your result. They are processed in memory to compute the response and are not
          written to any database or log.
        </p>
        <p>
          While you are using the site, your answers are kept in your browser&apos;s session storage
          so you can move between pages and refresh without losing your result. They are cleared
          automatically when you close the tab.
        </p>
      </Section>

      <Section title="Analytics">
        <p>
          To understand overall usage we rely on anonymous, aggregate measures only, such as how
          many reflections have been generated and general traffic patterns. These use no cookies
          that identify you and cannot be traced back to an individual or to anyone&apos;s answers.
        </p>
      </Section>

      <Section title="Sharing">
        <p>
          Because no personal data is collected, there is no personal data to sell, share, or hand
          to third parties.
        </p>
      </Section>

      <Section title="Your control">
        <p>
          Closing the tab clears your session entirely. There is nothing stored on our side for you
          to request, export, or delete.
        </p>
      </Section>

      <Section title="Contact">
        <p>
          Questions about privacy, or about how the tool works, can go to{' '}
          <a
            href="mailto:contact@firasa.agrimverma.dev"
            className="font-medium text-brand-600 hover:underline"
          >
            contact@firasa.agrimverma.dev
          </a>
          . You can also reach the maintainer via{' '}
          <a
            href="https://github.com/AgrimVerma11"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-brand-600 hover:underline"
          >
            GitHub
          </a>{' '}
          or{' '}
          <a
            href="https://www.linkedin.com/in/agrimverma11"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-brand-600 hover:underline"
          >
            LinkedIn
          </a>
          .
        </p>
      </Section>

      <p className="mt-10 text-sm text-ink-500">
        See also our{' '}
        <Link to="/terms" className="font-medium text-brand-600 hover:underline">
          terms of use
        </Link>
        .
      </p>
    </div>
  );
}
