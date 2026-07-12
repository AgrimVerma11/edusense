import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RefreshCw, MessagesSquare, Activity, Target, Sliders, Radar as RadarIcon } from 'lucide-react';
import { useAssessment } from '../context/AssessmentContext';
import Card, { CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Disclaimer from '../components/ui/Disclaimer';
import RiskBadge from '../components/dashboard/RiskBadge';
import ScoreMeter from '../components/dashboard/ScoreMeter';
import ClusterCard from '../components/dashboard/ClusterCard';
import ProfileRadar from '../components/dashboard/ProfileRadar';
import FeatureImportanceChart from '../components/dashboard/FeatureImportanceChart';
import InterventionPanel from '../components/dashboard/InterventionPanel';
import WhatIfPanel from '../components/dashboard/WhatIfPanel';
import { toPercent } from '../lib/format';
import { event } from '../lib/track';
import { usePageMeta } from '../lib/usePageMeta';

const reveal = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

export default function Results() {
  const { result, answers, reset } = useAssessment();
  const navigate = useNavigate();

  usePageMeta({
    title: 'Your reading | Firasa',
    description:
      'Your Firasa reading: a behavioural profile, an indicative trajectory, a risk signal, and the one habit to change first.',
    path: '/results',
    noindex: true,
  });

  // Land here without a result (refresh, deep link) and there is nothing to
  // show, so send the student back to the questionnaire.
  if (!result) return <Navigate to="/assessment" replace />;

  const {
    cluster,
    predicted_score,
    risk_level,
    risk_probability,
    framing,
    top_interventions,
    risk_drivers,
    guidance,
    maintenance,
  } = result;

  const retake = () => {
    event('retake');
    reset();
    navigate('/assessment');
  };

  return (
    <div className="container-page py-12 sm:py-16">
      {/* Header */}
      <motion.div initial="hidden" animate="show" variants={reveal} className="max-w-3xl">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">
            Your reading
          </span>
          <RiskBadge level={risk_level} size="lg" />
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
          {framing?.headline}
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-ink-500">{framing?.reflection}</p>
      </motion.div>

      {/* Top summary row */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={stagger}
        className="mt-10 grid gap-6 lg:grid-cols-3"
      >
        <motion.div variants={reveal}>
          <Card className="h-full">
            <ClusterCard cluster={cluster} />
          </Card>
        </motion.div>

        <motion.div variants={reveal}>
          <Card className="flex h-full flex-col">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-400">
              Indicative trajectory
            </p>
            <div className="flex flex-1 items-center justify-center">
              <ScoreMeter
                score={predicted_score}
                riskLevel={risk_level}
                note={framing?.score_note}
              />
            </div>
          </Card>
        </motion.div>

        <motion.div variants={reveal}>
          <Card className="flex h-full flex-col justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
                Risk signal
              </p>
              <div className="mt-3">
                <RiskBadge level={risk_level} size="lg" />
              </div>
            </div>
            <div className="mt-6">
              <p className="text-4xl font-bold tracking-tight text-ink-900">
                {toPercent(risk_probability)}
                <span className="text-2xl text-ink-400">%</span>
              </p>
              <p className="mt-1 text-sm text-ink-500">
                How strongly your current habits line up with a higher-risk pattern. It moves as your
                habits do.
              </p>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Charts row */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Your behavioural profile"
            subtitle="Further from the centre is a healthier habit."
            icon={RadarIcon}
          />
          <ProfileRadar answers={answers} />
        </Card>

        <Card>
          <CardHeader
            title="What is carrying the most weight"
            subtitle="The habits weighing most on your signal right now."
            icon={Activity}
          />
          <FeatureImportanceChart drivers={risk_drivers} />
        </Card>
      </div>

      {/* Actions row */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="The sign"
            subtitle="Tied to your own answers, ranked by likely impact."
            icon={Target}
          />
          <InterventionPanel
            interventions={top_interventions}
            guidance={guidance}
            maintenance={maintenance}
          />
        </Card>

        <Card>
          <CardHeader
            title="If this changed"
            subtitle="See how one shift could move your outlook."
            icon={Sliders}
          />
          <WhatIfPanel student={answers} />
        </Card>
      </div>

      {/* Mentor nudge */}
      <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-brand-50 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
            <MessagesSquare size={20} />
          </span>
          <div>
            <p className="font-semibold text-ink-900">Turn this into a conversation</p>
            <p className="mt-1 max-w-xl text-sm text-ink-600">
              A reflection is most useful when you share it. Talking these patterns through with a
              mentor, professor, or counsellor is often what turns them into a real plan.
            </p>
          </div>
        </div>
        <Button variant="secondary" onClick={retake} className="shrink-0">
          <RefreshCw size={16} /> Retake
        </Button>
      </div>

      <div className="mt-6">
        <Disclaimer text={result.disclaimer} />
      </div>
    </div>
  );
}
