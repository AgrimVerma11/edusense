import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import FirasaMark from '../components/FirasaMark';
import { usePageMeta } from '../lib/usePageMeta';
import { event } from '../lib/track';
import { cn } from '../lib/cn';

// Behind the name. A quiet, scroll-paced page that sits apart from the working
// screens of the app: wider margins, lighter type, one accent. It reads the
// name, then the mark, then closes on what the tool is for. Palette and tokens
// are the site's own; the older feeling comes from pacing and restraint, not a
// separate colour.

const PAGE_TITLE = 'Behind the name | Firasa';
const PAGE_DESCRIPTION =
  'Firasa is an Arabic word for reading a person’s inner state from outward signs. The name, the mark, and the idea behind a tool that names the one habit costing you the most.';

const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Behind the name',
  description: PAGE_DESCRIPTION,
  url: 'https://firasa.agrimverma.dev/name',
  isPartOf: {
    '@type': 'WebSite',
    name: 'Firasa',
    url: 'https://firasa.agrimverma.dev',
  },
};

const MARK_PARTS = [
  {
    id: 'aperture',
    label: 'The aperture',
    text: 'An open circle, never closed. A reading that could still change, not a verdict passed.',
  },
  {
    id: 'horizon',
    label: 'The horizon',
    text: 'The still surface that reflects, running wider than the circle. What a person carries reaches past what can be seen of them.',
  },
  {
    id: 'reflection',
    label: 'The reflection',
    text: 'Beneath the surface, faint on purpose. The pattern that was already there before anyone looked.',
  },
  {
    id: 'sign',
    label: 'The sign',
    text: 'One point, and the only solid mark. The single thing a reading is meant to surface.',
  },
];

// Backdrop mark for the hero. The mark's horizon sits 62% of the way down, so we
// hang the mark below the title block by (0.38 * size) less a few pixels, which
// lands the horizon just under the title baseline and lets the title rest on it.
const HERO_MARK_SIZE = 380;
const HERO_MARK_DROP = Math.round(HERO_MARK_SIZE * 0.38) - 10;

function Reveal({ children, delay = 0, className }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  );
}

// A small horizon-and-reflection motif, the lower half of the mark, used to
// separate the movements. Quieter and more particular than a plain dot.
function Divider() {
  return (
    <div className="my-16 flex justify-center" aria-hidden="true">
      <svg width="66" height="14" viewBox="0 0 66 14" fill="none">
        <line x1="8" y1="5" x2="58" y2="5" stroke="#a9a1e2" strokeWidth="1" strokeLinecap="round" />
        <path
          d="M23 6 Q33 13 43 6"
          stroke="#a9a1e2"
          strokeWidth="1"
          strokeLinecap="round"
          opacity="0.55"
        />
        <circle cx="33" cy="5" r="1.4" fill="#8479d2" />
      </svg>
    </div>
  );
}

function Heading({ numeral, children }) {
  return (
    <div className="mb-6">
      {numeral ? (
        <span className="mb-3 flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.28em] text-brand-500">
          {numeral}
          <span className="h-px w-6 bg-brand-200" />
        </span>
      ) : null}
      <h2 className="text-[26px] font-semibold leading-snug tracking-tight text-ink-900 sm:text-[28px]">
        {children}
      </h2>
    </div>
  );
}

function Body({ children, className }) {
  return <p className={cn('text-[17px] leading-[1.85] text-ink-700', className)}>{children}</p>;
}

// The opening line of a movement: a touch larger and darker, so each section
// has a considered entry instead of an even wall of grey.
function Lead({ children, className }) {
  return <p className={cn('text-[19px] leading-[1.8] text-ink-800', className)}>{children}</p>;
}

function Mark({ children }) {
  return <strong className="font-semibold text-ink-900">{children}</strong>;
}

// The mark, drawn element by element as it enters view. Hovering or focusing a
// meaning lifts the matching part of the mark. Geometry mirrors FirasaMark.
function MarkReveal() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(null);

  const strokeOf = (id, base = '#505d73') => {
    if (!active) return base;
    return active === id ? '#534ab7' : '#cdc9ef';
  };
  const draw = (delay, duration = 0.9) =>
    reduce
      ? {}
      : {
          initial: { pathLength: 0, opacity: 0 },
          whileInView: { pathLength: 1, opacity: 1 },
          viewport: { once: true, margin: '-40px' },
          transition: { duration, ease: 'easeInOut', delay },
        };

  const reflectionOpacity = active === 'reflection' ? 0.6 : active ? 0.12 : 0.32;
  const dotFill = active && active !== 'sign' ? '#a9a1e2' : '#534ab7';

  return (
    <div className="flex flex-col items-center">
      <svg
        width="212"
        height="212"
        viewBox="0 0 100 100"
        fill="none"
        role="img"
        aria-label="The Firasa mark: an open circle, a horizon line, a faint reflection, and one filled dot."
      >
        <motion.path
          d="M80.81 33.63A34 34 0 1 1 64.37 17.19"
          stroke={strokeOf('aperture')}
          strokeWidth={active === 'aperture' ? 2.6 : 2}
          strokeLinecap="round"
          style={{ transition: 'stroke 0.25s, stroke-width 0.25s' }}
          {...draw(0, 1.1)}
        />
        <motion.line
          x1="15"
          y1="62"
          x2="85"
          y2="62"
          stroke={strokeOf('horizon')}
          strokeWidth={active === 'horizon' ? 2.1 : 1.75}
          strokeLinecap="round"
          style={{ transition: 'stroke 0.25s, stroke-width 0.25s' }}
          {...draw(0.6, 0.8)}
        />
        <path
          d="M35 64Q50 74 65 64"
          stroke={active === 'reflection' ? '#534ab7' : '#65748c'}
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity={reflectionOpacity}
          style={{ transition: 'stroke 0.25s, opacity 0.25s' }}
        />
        <motion.circle
          cx="50"
          cy="60"
          r="3.8"
          fill={dotFill}
          style={{ transition: 'fill 0.25s' }}
          initial={reduce ? false : { opacity: 0 }}
          whileInView={reduce ? undefined : { opacity: 1 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={reduce ? undefined : { delay: 1.2, duration: 0.45, ease: 'easeOut' }}
        />
      </svg>

      <div className="mt-10 w-full space-y-1">
        {MARK_PARTS.map((part, i) => (
          <Reveal key={part.id} delay={reduce ? 0 : 0.15 * i}>
            <button
              type="button"
              onMouseEnter={() => setActive(part.id)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(part.id)}
              onBlur={() => setActive(null)}
              className={cn(
                'block w-full rounded-xl px-4 py-3 text-left transition-colors',
                active === part.id ? 'bg-brand-50' : 'hover:bg-ink-100/70'
              )}
            >
              <span className="text-sm font-semibold tracking-wide text-ink-900">{part.label}</span>
              <span className="mt-1 block text-[15px] leading-relaxed text-ink-500">{part.text}</span>
            </button>
          </Reveal>
        ))}
      </div>
    </div>
  );
}

export default function Name() {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 0.5]);

  usePageMeta({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: '/name',
    jsonLd: JSON_LD,
  });

  useEffect(() => {
    event('behind_the_name_view');
  }, []);

  return (
    <div className="mx-auto w-full max-w-[640px] px-5 pb-24">
      {/* Hero */}
      <header className="relative flex flex-col items-center overflow-hidden pb-28 pt-28 text-center">
        <div className="relative flex flex-col items-center">
          {/* The mark, hung so the title rests on its horizon line. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 -translate-x-1/2"
            style={{ bottom: -HERO_MARK_DROP }}
          >
            <motion.div style={{ rotate: reduce ? 0 : rotate }} className="text-brand-500">
              <div style={{ opacity: 0.07 }}>
                <FirasaMark size={HERO_MARK_SIZE} accent="currentColor" />
              </div>
            </motion.div>
          </div>

          <div className="relative flex items-center gap-3">
            <span className="h-px w-9 bg-brand-200" />
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-600">
              firasa &middot; fi-RAH-sa
            </p>
            <span className="h-px w-9 bg-brand-200" />
          </div>
          <h1 className="relative mt-5 text-[44px] font-normal leading-none tracking-tight text-ink-900 sm:text-[56px]">
            Behind the name
          </h1>
        </div>
      </header>

      {/* The name */}
      <Reveal>
        <Lead>
          Firasa is an Arabic word for a discipline that was practised and written about for
          centuries. It means <Mark>the reading of a person&rsquo;s inner condition from their
          outward signs</Mark>.
        </Lead>
        <Body className="mt-6">
          Scholars in the tenth and eleventh centuries treated it as a serious subject and wrote
          treatises on it. The word shares a root with the word for <Mark>horseman</Mark>, and the
          link was deliberate. A skilled rider could read a horse&rsquo;s temperament and capacity
          from its <Mark>bearing</Mark> alone, before ever mounting it. Firasa was that skill turned
          toward people.
        </Body>
      </Reveal>

      <Divider />

      {/* Two kinds of reading */}
      <Reveal>
        <Heading numeral="I">Two kinds of reading</Heading>
        <Lead>
          The tradition described firasa as having <Mark>two branches</Mark>, and both are present in
          this tool.
        </Lead>
        <Body className="mt-6">
          The first was <Mark>systematic</Mark>. Practitioners observed patterns, recorded them, and
          inferred inner states from outward behaviour. Fakhr al-Din al-Razi wrote about it as a
          method. It was, in effect, an early attempt at what we would now call behavioural
          inference.
        </Body>
        <Body className="mt-5">
          The second was <Mark>immediate</Mark>. Not a process of reasoning but a moment of
          perception. The understanding arrives whole. You see something about a person that you
          could not have argued your way toward.
        </Body>
        <Body className="mt-5">
          <Mark>A model does the first. A person does the second.</Mark> The gap between them is where
          this tool works. The algorithm assembles the reading. The moment you see it, something
          settles into place that no amount of explanation could have produced.
        </Body>
      </Reveal>

      <Divider />

      {/* What the tradition insisted on */}
      <Reveal>
        <Heading numeral="II">What the tradition insisted on</Heading>
        <Lead>
          Firasa was never meant to be a verdict. The scholars who wrote about it were explicit that
          it existed <Mark>for understanding, not for judgment</Mark>. To use it to condemn someone
          was to misuse it entirely.
        </Lead>
        <Body className="mt-6">
          That is a strange thing to find in a thousand-year-old text and recognise as your own
          design principle.
        </Body>
        <Body className="mt-5">
          Firasa does not score you. It does not rank you against anyone. It reads what you tell it
          about your own habits and shows you which one is doing the most work against you.
        </Body>
        <p
          className="mt-8 text-[22px] italic text-ink-700"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          What you do with that is yours.
        </p>
      </Reveal>

      <Divider />

      {/* The mark */}
      <Reveal>
        <Heading numeral="III">The mark</Heading>
        <Body className="mb-12">
          The logo is the same idea, drawn. Four elements, each carrying its share of the meaning.
        </Body>
      </Reveal>
      <MarkReveal />

      <Divider />

      {/* In practice */}
      <Reveal>
        <Heading numeral="IV">In practice</Heading>
        <Lead>
          The tool takes what you can observe about yourself. Sleep. Consistency. Attendance. How
          often you put things off.
        </Lead>
        <Body className="mt-6">
          It infers what you cannot observe directly: where those patterns are taking you, and{' '}
          <Mark>which single behaviour is carrying the most weight</Mark> in that outcome.
        </Body>
        <Body className="mt-5">
          That inference is the whole of it. An eleventh-century scholar would have recognised the
          question. He would have had a different method.
        </Body>
      </Reveal>

      <Divider />

      {/* Where it goes */}
      <Reveal>
        <Heading numeral="V">Where it goes</Heading>
        <Lead>
          For now, Firasa is a free reading, honest about being directional, trained on public data,
          and open about its limits.
        </Lead>
        <Body className="mt-6">
          What it is built to become is a tool that learns whether the one change it named actually
          moved the outcome. A reading that grows truer the more honestly it is used.
        </Body>
        <Body className="mt-5">
          The question underneath it is not only academic. Outcomes ride on rhythm, sleep, avoidance,
          and consistency in every part of a life that matters. <Mark>The reading generalises.</Mark>{' '}
          The name will not have to change.
        </Body>
      </Reveal>

      <Divider />

      {/* Inscription */}
      <Reveal className="text-center">
        <p
          className="mx-auto max-w-md text-[23px] italic leading-relaxed text-ink-600"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
        >
          Know thyself, and grow in grace.
        </p>
        <Link
          to="/assessment"
          className="mt-12 inline-block text-[15px] font-medium text-brand-600 underline decoration-brand-300 underline-offset-4 transition-colors hover:text-brand-700"
        >
          Take the reading
        </Link>
        <p className="mt-12 text-xs leading-relaxed text-ink-400">
          Firasa is trained on public student datasets. It stores nothing you enter.
        </p>
      </Reveal>
    </div>
  );
}
