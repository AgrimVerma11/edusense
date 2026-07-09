import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { wakeApi } from '../lib/api';
import {
  ArrowRight,
  ClipboardList,
  Compass,
  LineChart,
  Lightbulb,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Disclaimer from '../components/ui/Disclaimer';

const STEPS = [
  {
    icon: ClipboardList,
    title: 'Answer honestly',
    body: 'A short set of questions about your study habits, focus, sleep, and goals. No right answers, just your normal week.',
  },
  {
    icon: Compass,
    title: 'See your profile',
    body: 'We place your habits against thousands of other students and show the group your patterns most resemble.',
  },
  {
    icon: Lightbulb,
    title: 'Reflect and act',
    body: 'You get a plain-language read of what is helping, what is holding you back, and a few small steps to try.',
  },
];

const FEATURES = [
  {
    icon: Compass,
    title: 'Behavioural profile',
    body: 'Which of four study personas your current habits line up with, and what that group tends to look like.',
  },
  {
    icon: LineChart,
    title: 'Indicative trajectory',
    body: 'A rough sense of where your current habits could lead, framed as a direction to reflect on, never a grade.',
  },
  {
    icon: ShieldCheck,
    title: 'Honest risk signal',
    body: 'A clear read on how your patterns compare, with the specific habits driving it laid out openly.',
  },
  {
    icon: Lightbulb,
    title: 'Personal next steps',
    body: 'A ranked, doable set of changes tied to your own answers, plus a what-if tool to test them.',
  },
];

const STATS = [
  { value: '4', label: 'Study datasets' },
  { value: '31,810', label: 'Student records' },
  { value: '4', label: 'Behavioural personas' },
  { value: '62', label: 'Behavioural signals' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.08, ease: 'easeOut' },
  }),
};

export default function Home() {
  useEffect(() => {
    // Nudge the free-tier API awake early, while the student reads and browses,
    // so the first prediction is not the request that pays the cold-start cost.
    wakeApi();
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="grid-backdrop absolute inset-0 -z-10" />
        <div className="container-page pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="mx-auto max-w-3xl text-center">
            <motion.span
              initial="hidden"
              animate="show"
              variants={fadeUp}
              className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700"
            >
              <Layers size={14} /> Academic risk intelligence, built for reflection
            </motion.span>

            <motion.h1
              initial="hidden"
              animate="show"
              custom={1}
              variants={fadeUp}
              className="mt-5 text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl"
            >
              Understand your study habits before they decide your semester.
            </motion.h1>

            <motion.p
              initial="hidden"
              animate="show"
              custom={2}
              variants={fadeUp}
              className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-ink-500"
            >
              EduSense reads the patterns in how you study, rest, and plan, then reflects them back
              in plain language with a few small steps worth trying. It is a mirror for your
              routine, not a verdict on your ability.
            </motion.p>

            <motion.div
              initial="hidden"
              animate="show"
              custom={3}
              variants={fadeUp}
              className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
            >
              <Button as={Link} to="/assessment" size="lg" className="w-full sm:w-auto">
                Start your assessment <ArrowRight size={18} />
              </Button>
              <Button as={Link} to="/insights" variant="secondary" size="lg" className="w-full sm:w-auto">
                Explore the insights
              </Button>
            </motion.div>

            <motion.p
              initial="hidden"
              animate="show"
              custom={4}
              variants={fadeUp}
              className="mt-4 text-sm text-ink-400"
            >
              Takes about three minutes. Nothing you enter is stored.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container-page">
        <div className="grid grid-cols-2 gap-4 rounded-2xl border border-ink-100 bg-white p-6 shadow-card sm:grid-cols-4 sm:p-8">
          {STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold tracking-tight text-brand-700">{stat.value}</p>
              <p className="mt-1 text-sm text-ink-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="container-page pt-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-ink-900">How it works</h2>
          <p className="mt-3 text-ink-500">
            Three steps, no jargon. The whole point is that you leave with something you can act on.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              custom={i}
              variants={fadeUp}
            >
              <Card className="h-full">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
                    <step.icon size={20} />
                  </span>
                  <span className="text-sm font-semibold text-ink-400">Step {i + 1}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-ink-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{step.body}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* What you get */}
      <section className="container-page pt-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-ink-900">What you walk away with</h2>
          <p className="mt-3 text-ink-500">
            Four layers of insight, each grounded in your own answers and explained openly.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              custom={i}
              variants={fadeUp}
            >
              <Card className="flex h-full gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <feature.icon size={20} />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-ink-900">{feature.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{feature.body}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-page pt-20">
        <div className="relative overflow-hidden rounded-3xl bg-brand-700 px-6 py-14 text-center sm:px-12">
          <div className="grid-backdrop absolute inset-0 opacity-40" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Ready to see your patterns?
            </h2>
            <p className="mt-3 text-brand-100">
              A few honest answers is all it takes. You can retake it any time your routine shifts.
            </p>
            <Button
              as={Link}
              to="/assessment"
              size="lg"
              variant="secondary"
              className="mt-7 border-transparent"
            >
              Start your assessment <ArrowRight size={18} />
            </Button>
          </div>
        </div>
        <div className="mx-auto mt-8 max-w-3xl">
          <Disclaimer />
        </div>
      </section>
    </div>
  );
}
