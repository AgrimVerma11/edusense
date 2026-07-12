import { useRef, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, RotateCcw } from 'lucide-react';
import { whatIf } from '../../lib/api';
import { WHATIF_LEVERS } from '../../config/schema';
import { toPercent, signed } from '../../lib/format';
import { cn } from '../../lib/cn';
import { event } from '../../lib/track';
import Spinner from '../ui/Spinner';
import RiskBadge from './RiskBadge';

const LEVER_LABEL = WHATIF_LEVERS.reduce((acc, lever) => {
  acc[lever.feature] = lever.label;
  return acc;
}, {});

function DeltaStat({ label, before, after, delta, goodDirection, formatValue }) {
  // goodDirection is +1 when higher is better (score), -1 when lower is better (risk).
  const improved = delta * goodDirection > 0;
  const flat = delta === 0;
  const Icon = flat ? Minus : improved ? TrendingUp : TrendingDown;
  const tone = flat ? 'text-ink-400' : improved ? 'text-risk-low' : 'text-risk-high';

  return (
    <div className="flex-1 rounded-xl bg-ink-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-sm text-ink-400 line-through">{formatValue(before)}</span>
        <span className="text-xl font-bold text-ink-900">{formatValue(after)}</span>
      </div>
      <div className={cn('mt-1 flex items-center gap-1 text-xs font-semibold', tone)}>
        <Icon size={13} />
        {flat ? 'No change' : `${formatValue(delta, true)} change`}
      </div>
    </div>
  );
}

// Lets a student stack several "what if I..." changes and see their combined
// effect. Every active lever is sent to the /what-if endpoint together, so
// adjusting a second lever builds on the first instead of replacing it. A pick
// only counts as a change when it differs from the student's current answer.
export default function WhatIfPanel({ student }) {
  const [picks, setPicks] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Guards against out-of-order responses when levers are changed quickly.
  const requestId = useRef(0);
  const trackedRef = useRef(false);

  const activeChangesFrom = (chosen) =>
    Object.entries(chosen)
      .filter(([feature, value]) => value !== student[feature])
      .map(([feature, new_value]) => ({ feature, new_value }));

  const recompute = async (nextPicks) => {
    const modifications = activeChangesFrom(nextPicks);
    if (modifications.length === 0) {
      setResult(null);
      setError(null);
      setLoading(false);
      return;
    }
    const id = (requestId.current += 1);
    setLoading(true);
    setError(null);
    try {
      const data = await whatIf(student, modifications);
      if (id === requestId.current) {
        setResult(data);
        if (!trackedRef.current) {
          trackedRef.current = true;
          event('what_if_used');
        }
      }
    } catch (err) {
      if (id === requestId.current) {
        setError(err.message);
        setResult(null);
      }
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  };

  const pick = (feature, value) => {
    const next = { ...picks, [feature]: value };
    setPicks(next);
    recompute(next);
  };

  const resetAll = () => {
    requestId.current += 1; // invalidate anything in flight
    setPicks({});
    setResult(null);
    setError(null);
    setLoading(false);
  };

  const activeChanges = activeChangesFrom(picks);

  return (
    <div>
      <div className="space-y-4">
        {WHATIF_LEVERS.map((lever) => {
          const selected = picks[lever.feature] ?? student[lever.feature] ?? '';
          const changed =
            picks[lever.feature] !== undefined && picks[lever.feature] !== student[lever.feature];
          return (
            <div key={lever.feature}>
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-sm font-medium text-ink-800">
                  {lever.label}
                  {changed && (
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-500" title="Changed" />
                  )}
                </span>
                <span className="text-xs text-ink-400">{lever.hint}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {lever.options.map((option) => {
                  const isOn = selected === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => pick(lever.feature, option)}
                      className={cn(
                        'rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
                        isOn
                          ? 'border-brand-600 bg-brand-600 text-white'
                          : 'border-ink-200 bg-white text-ink-600 hover:border-brand-300'
                      )}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {activeChanges.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-ink-400">Trying:</span>
          {activeChanges.map((change) => (
            <span
              key={change.feature}
              className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700"
            >
              {LEVER_LABEL[change.feature] || change.feature}: {change.new_value}
            </span>
          ))}
          <button
            type="button"
            onClick={resetAll}
            className="inline-flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-900"
          >
            <RotateCcw size={12} /> Reset
          </button>
        </div>
      )}

      <div className="mt-5 min-h-[128px] rounded-xl border border-dashed border-ink-200 p-4">
        {loading && (
          <div className="flex h-full items-center justify-center gap-2 py-6 text-sm text-ink-500">
            <Spinner size={18} /> Recalculating...
          </div>
        )}

        {!loading && error && <p className="py-6 text-center text-sm text-risk-high">{error}</p>}

        {!loading && !error && !result && (
          <p className="py-8 text-center text-sm text-ink-400">
            Change any lever above to see how it could move your outlook. You can combine several at
            once.
          </p>
        )}

        {!loading && !error && result && (
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-ink-500">
                With {activeChanges.length === 1 ? 'this change' : `these ${activeChanges.length} changes`}
                , your risk signal reads
              </span>
              <RiskBadge level={result.new_risk_level} />
              {result.new_risk_level !== result.original_risk_level && (
                <span className="text-xs text-ink-400">(was {result.original_risk_level})</span>
              )}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <DeltaStat
                label="Indicative score"
                before={result.original_score}
                after={result.new_score}
                delta={result.score_delta}
                goodDirection={1}
                formatValue={(v, isDelta) => (isDelta ? signed(v) : Math.round(v))}
              />
              <DeltaStat
                label="Risk likelihood"
                before={result.original_risk_probability}
                after={result.new_risk_probability}
                delta={result.risk_probability_delta}
                goodDirection={-1}
                formatValue={(v, isDelta) => (isDelta ? `${signed(v * 100, 0)}%` : `${toPercent(v)}%`)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
