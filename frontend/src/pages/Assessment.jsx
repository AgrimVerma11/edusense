import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { STEPS } from '../config/schema';
import { useAssessment } from '../context/AssessmentContext';
import { predictStudent, wakeApi } from '../lib/api';
import { event } from '../lib/track';
import { usePageMeta } from '../lib/usePageMeta';
import Field from '../components/form/Field';
import Button from '../components/ui/Button';
import ProgressBar from '../components/ui/ProgressBar';
import Spinner from '../components/ui/Spinner';
import ConsentGate from '../components/ConsentGate';

// A field must be answered before we score unless it is optional or one of the
// pre-filled inputs (numeric scales and age always hold a valid value).
function isRequired(field) {
  return !field.optional && (field.type === 'segmented' || field.type === 'select');
}

export default function Assessment() {
  const navigate = useNavigate();
  const { answers, setAnswer, setResult, consented, acceptConsent } = useAssessment();

  usePageMeta({
    title: 'The reading | Firasa',
    description:
      'A short, private set of questions about how you study, sleep, and plan. Firasa turns your answers into a reading of your habits. No signup, nothing stored.',
    path: '/assessment',
    noindex: true,
  });

  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [invalidFields, setInvalidFields] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  useEffect(() => {
    // Warm the API in case the student deep-linked straight to the assessment,
    // so submitting does not wait on a cold start.
    wakeApi();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [stepIndex]);

  const missingFields = useMemo(() => {
    return step.fields
      .filter((field) => isRequired(field))
      .filter((field) => {
        const value = answers[field.name];
        return value === undefined || value === null || value === '';
      })
      .map((field) => field.name);
  }, [step, answers]);

  const submit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await predictStudent(answers);
      setResult(result);
      event('reading_generated', {
        risk: result?.risk_level,
        persona: result?.cluster?.display_name,
      });
      navigate('/results');
    } catch (err) {
      setSubmitError(err.message);
      setSubmitting(false);
    }
  };

  const goNext = () => {
    if (missingFields.length > 0) {
      setInvalidFields(missingFields);
      return;
    }
    setInvalidFields([]);
    if (isLast) {
      submit();
      return;
    }
    setDirection(1);
    setStepIndex((i) => i + 1);
  };

  const goBack = () => {
    setInvalidFields([]);
    setSubmitError(null);
    setDirection(-1);
    setStepIndex((i) => Math.max(0, i - 1));
  };

  // Gate the questionnaire behind the consent notice until it is acknowledged.
  if (!consented) {
    return (
      <ConsentGate
        onAccept={() => {
          event('assessment_started');
          acceptConsent();
        }}
      />
    );
  }

  return (
    <div className="container-page max-w-2xl py-12 sm:py-16">
      <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">
        The reading
      </p>

      {/* Progress header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium text-brand-700">
            Step {stepIndex + 1} of {STEPS.length}
          </span>
          <span className="text-ink-400">{Math.round(progress)}% complete</span>
        </div>
        <ProgressBar value={progress} />
      </div>

      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step.id}
          custom={direction}
          initial={{ opacity: 0, x: direction * 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -24 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-ink-900">{step.title}</h1>
            <p className="mt-1.5 text-ink-500">{step.subtitle}</p>
          </div>

          <div className="card space-y-7 p-6 sm:p-8">
            {step.fields.map((field) => (
              <Field
                key={field.name}
                field={field}
                value={answers[field.name] ?? ''}
                onChange={(value) => setAnswer(field.name, value)}
                invalid={invalidFields.includes(field.name)}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      {submitError && (
        <div className="mt-5 rounded-xl border border-risk-high/30 bg-risk-high/5 p-4 text-sm text-risk-high">
          {submitError}
        </div>
      )}

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" onClick={goBack} disabled={stepIndex === 0 || submitting}>
          <ArrowLeft size={18} /> Back
        </Button>

        <Button onClick={goNext} disabled={submitting} size="lg">
          {submitting ? (
            <>
              <Spinner size={18} className="text-white" /> Reading your patterns...
            </>
          ) : isLast ? (
            <>
              <Sparkles size={18} /> See what it finds
            </>
          ) : (
            <>
              Continue <ArrowRight size={18} />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
