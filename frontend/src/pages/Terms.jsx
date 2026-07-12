import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { usePageMeta } from '../lib/usePageMeta';

function Section({ title, children }) {
  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
      <div className="mt-2 space-y-3 text-sm leading-relaxed text-ink-600">{children}</div>
    </section>
  );
}

export default function Terms() {
  usePageMeta({
    title: 'Terms of use | Firasa',
    description:
      'The terms of use for Firasa, a self-reflection tool. What it is, what it is not, and how to use it well.',
    path: '/terms',
  });

  return (
    <div className="container-page max-w-3xl py-14">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        <FileText size={20} />
      </span>
      <h1 className="mt-5 text-3xl font-bold tracking-tight text-ink-900">Terms of use</h1>
      <p className="mt-2 text-sm text-ink-400">Last updated: July 2026</p>

      <div className="mt-6 rounded-xl bg-brand-50 p-5 text-sm leading-relaxed text-brand-900">
        The short version: Firasa is a self-reflection tool. It does not diagnose anything and it
        does not predict your grades. Use it to reflect, and talk to a mentor or counsellor about
        anything that matters.
      </div>

      <Section title="What Firasa is, and is not">
        <p>
          Firasa reads patterns in self-reported study habits and wellbeing and reflects them
          back. It is not medical, psychological, or academic advice, and it is not a prediction of
          any individual&apos;s marks. Every result is indicative and meant as a prompt for
          reflection.
        </p>
      </Section>

      <Section title="Using it well">
        <p>
          Treat the output as one input among many, alongside your own judgement and the people who
          know your situation. For anything that genuinely concerns you, speak to a professor,
          mentor, or counsellor rather than relying on a model.
        </p>
      </Section>

      <Section title="No warranty">
        <p>
          The tool is provided on a best-effort, as-is basis. It may be inaccurate or incomplete,
          and it can change or be unavailable at any time. No guarantee is made about the accuracy
          of any result.
        </p>
      </Section>

      <Section title="Limitation of liability">
        <p>
          To the extent permitted by law, the maintainer is not liable for any decision made, or
          action taken, on the basis of anything this tool produces. You use it at your own
          discretion.
        </p>
      </Section>

      <Section title="If you are struggling">
        <p>
          Firasa is not a crisis service. If you are feeling distressed, please reach out to your
          institution&apos;s counselling service or a trusted person straight away.
        </p>
      </Section>

      <Section title="Changes">
        <p>
          These terms may be updated as the tool evolves. Continued use after a change means you
          accept the updated terms.
        </p>
      </Section>

      <p className="mt-10 text-sm text-ink-500">
        See also our{' '}
        <Link to="/privacy" className="font-medium text-brand-600 hover:underline">
          privacy note
        </Link>
        .
      </p>
    </div>
  );
}
