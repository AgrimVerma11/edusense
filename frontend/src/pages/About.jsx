import { Link } from 'react-router-dom';
import {
  Layers,
  GitBranch,
  ScanSearch,
  ShieldCheck,
  Scale,
  Lock,
  ArrowRight,
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Disclaimer from '../components/ui/Disclaimer';
import { usePageMeta } from '../lib/usePageMeta';

const LAYERS = [
  {
    icon: Layers,
    title: 'Behavioural clustering',
    body: 'Unsupervised learning groups students by how they actually study, rest, and plan, surfacing four recurring profiles rather than sorting anyone by grades.',
  },
  {
    icon: GitBranch,
    title: 'Score and risk models',
    body: 'A gradient-boosted regressor estimates an indicative trajectory, while a calibrated classifier reads how a set of habits compares against a broad student population.',
  },
  {
    icon: ScanSearch,
    title: 'Transparent explanations',
    body: 'Every risk signal is broken down with SHAP, so the specific habits driving it are shown openly and each recommendation is traceable to one of your own answers.',
  },
];

const PRINCIPLES = [
  {
    icon: ShieldCheck,
    title: 'Reflection, not diagnosis',
    body: 'Results are framed as prompts to think and talk about, never as a clinical verdict or a grade prediction. The language is chosen to inform without labelling.',
  },
  {
    icon: Scale,
    title: 'Fairness by design',
    body: 'Protected attributes such as gender are deliberately excluded from every model, so the signal comes from habits a student can actually change.',
  },
  {
    icon: Lock,
    title: 'Nothing is stored',
    body: 'Answers are sent once to generate a result and are never saved to a database or linked to an identity. Close the tab and it is gone.',
  },
];

function Section({ eyebrow, title, children }) {
  return (
    <section className="pt-16">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default function About() {
  usePageMeta({
    title: 'About | Firasa',
    description:
      'How Firasa works: four machine-learning layers, dual SHAP and LIME explanations, and cross-dataset validation. Built to read study habits honestly, not to judge.',
    path: '/about',
  });

  return (
    <div className="container-page py-12 sm:py-16">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight text-ink-900">About Firasa</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-500">
          Firasa turns everyday study habits into a clear, honest reflection. The aim is simple:
          give students a mirror for their routine early enough to do something with it, and to do
          it in a way that respects both their privacy and their sense of self.
        </p>
      </div>

      <Section eyebrow="Method" title="Four layers working together">
        <div className="grid gap-6 md:grid-cols-3">
          {LAYERS.map((layer) => (
            <Card key={layer.title} className="h-full">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <layer.icon size={20} />
              </span>
              <h3 className="mt-4 text-base font-semibold text-ink-900">{layer.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{layer.body}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section eyebrow="Data" title="Trained honestly, validated across sources">
        <Card>
          <p className="leading-relaxed text-ink-600">
            The models are trained on four separate student datasets totalling well over thirty
            thousand records. Rather than reporting a single flattering number, the score model is
            trained on one source and then measured on an untouched holdout, with a second dataset
            kept as a negative control where transfer is expected to fail. That cross-dataset check
            is deliberately conservative: it tells us how much of the pattern is real and how much is
            an artefact of one particular survey.
          </p>
          <p className="mt-4 leading-relaxed text-ink-600">
            The behavioural inputs you provide are mapped into the model feature space using
            documented, midpoint approximations. This is why the score is presented as an indicative
            direction rather than an exact figure. Being open about that boundary matters more than
            claiming a precision the data cannot support.
          </p>
        </Card>
      </Section>

      <Section eyebrow="Responsibility" title="How results are meant to be used">
        <div className="grid gap-6 md:grid-cols-3">
          {PRINCIPLES.map((item) => (
            <Card key={item.title} className="h-full">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <item.icon size={20} />
              </span>
              <h3 className="mt-4 text-base font-semibold text-ink-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{item.body}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section eyebrow="Limits" title="What this tool is not">
        <Card>
          <ul className="space-y-3 text-ink-600">
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              <span>
                It works from self-reported habits, which are honest but imperfect. The output is
                only ever as good as the reflection that goes in.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              <span>
                It does not diagnose any medical or psychological condition, and it cannot predict an
                individual&apos;s marks. It describes patterns, not fate.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              <span>
                It is one input among many. A mentor, a counsellor, or your own judgement should
                always outrank a model.
              </span>
            </li>
          </ul>
        </Card>
        <div className="mt-6">
          <Disclaimer />
        </div>
      </Section>

      <div className="mt-14 flex flex-col items-center gap-4 rounded-3xl bg-brand-700 px-6 py-12 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-white">See it on your own habits</h2>
        <p className="max-w-xl text-brand-100">
          The best way to understand Firasa is to try it. It takes a few minutes and nothing you
          enter leaves your session.
        </p>
        <Button as={Link} to="/assessment" variant="secondary" size="lg" className="border-transparent">
          Start your assessment <ArrowRight size={18} />
        </Button>
      </div>
    </div>
  );
}
