import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Coffee, Rocket, Target, CloudRain, Users, ArrowRight, Database } from 'lucide-react';
import { getClusterProfiles } from '../lib/api';
import { usePageMeta } from '../lib/usePageMeta';
import { featureLabel } from '../lib/format';
import RadarAngleTick from '../components/dashboard/RadarAngleTick';
import Card, { CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Spinner from '../components/ui/Spinner';

const CLUSTER_ICONS = { 0: Coffee, 1: Rocket, 2: Target, 3: CloudRain };
const SERIES_COLORS = ['#534ab7', '#1d9e75', '#ef9f27', '#d85a30'];

// Features shown on the comparative radar, each with its real range so the chart
// reflects the actual level a group sits at. All are part of the clustering
// feature set, so every persona has a value for them. The ordinal codes run 0 to
// 2 across their three bands; the numeric scales run 1 to 5.
const RADAR_FEATURES = [
  { key: 'study_hours_daily', domain: [0, 2] },
  { key: 'focus_duration', domain: [0, 2] },
  { key: 'daily_productivity', domain: [1, 5] },
  { key: 'sleep_hours', domain: [0, 2] },
  { key: 'career_goal_clarity', domain: [0, 2] },
  { key: 'stress_level', domain: [1, 5] },
];

// Scale each feature to its own real range. An earlier version rescaled across
// just the four group averages, which forced the lowest group to zero even when
// all four were nearly identical (making a Driven Achiever look like it had no
// focus). Scaling to the real range shows each group's actual typical level, so
// no group reads as a misleading zero.
function buildComparative(clusters) {
  return RADAR_FEATURES.filter(({ key }) =>
    clusters.every((c) => typeof c.feature_means?.[key] === 'number')
  ).map(({ key, domain }) => {
    const [low, high] = domain;
    const span = high - low || 1;
    const point = { axis: featureLabel(key) };
    clusters.forEach((c) => {
      const scaled = ((c.feature_means[key] - low) / span) * 100;
      point[c.display_name || c.name] = Math.round(Math.min(100, Math.max(0, scaled)));
    });
    return point;
  });
}

export default function Insights() {
  usePageMeta({
    title: 'Insights | Firasa',
    description:
      'Aggregate, anonymous insights from Firasa: how study behaviour clusters into four profiles, which habits matter most, and how risk is distributed.',
    path: '/insights',
  });

  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    getClusterProfiles()
      .then((data) => setClusters(data.clusters || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const totalStudents = useMemo(
    () => clusters.reduce((sum, c) => sum + (c.size || 0), 0),
    [clusters]
  );
  const comparative = useMemo(
    () => (clusters.length ? buildComparative(clusters) : []),
    [clusters]
  );

  return (
    <div className="container-page py-12 sm:py-16">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
          The four student profiles
        </h1>
        <p className="mt-3 text-lg leading-relaxed text-ink-500">
          Firasa groups study behaviour into four recurring patterns, learned from real student
          data rather than fixed rules. Here is what each group tends to look like, and how they
          differ.
        </p>
      </div>

      {loading && (
        <div className="mt-12 flex items-center justify-center gap-3 py-20 text-ink-500">
          <Spinner /> Loading the profiles...
        </div>
      )}

      {!loading && error && (
        <Card className="mt-12 text-center">
          <p className="text-ink-600">We could not load the profiles just now.</p>
          <p className="mt-1 text-sm text-ink-400">{error}</p>
          <Button variant="secondary" onClick={load} className="mt-4">
            Try again
          </Button>
        </Card>
      )}

      {!loading && !error && clusters.length > 0 && (
        <>
          {/* Comparative radar */}
          {comparative.length > 0 && (
            <Card className="mt-10">
              <CardHeader
                title="How the groups compare"
                subtitle="The typical level each group shows on each behaviour. Further out is more of that trait."
                icon={Users}
              />
              <ResponsiveContainer width="100%" height={380}>
                <RadarChart data={comparative} outerRadius="66%" margin={{ top: 12, right: 12, bottom: 12, left: 12 }}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="axis" tick={<RadarAngleTick />} />
                  {clusters.map((c, i) => {
                    const key = c.display_name || c.name;
                    return (
                      <Radar
                        key={key}
                        name={key}
                        dataKey={key}
                        stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                        fill={SERIES_COLORS[i % SERIES_COLORS.length]}
                        fillOpacity={0.08}
                        strokeWidth={2}
                      />
                    );
                  })}
                  <Legend wrapperStyle={{ fontSize: 13, paddingTop: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Persona cards */}
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {clusters.map((cluster, i) => {
              const Icon = CLUSTER_ICONS[cluster.id] || Users;
              const share = totalStudents ? Math.round((cluster.size / totalStudents) * 100) : 0;
              const color = SERIES_COLORS[i % SERIES_COLORS.length];
              return (
                <Card key={cluster.id} className="flex flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-11 w-11 items-center justify-center rounded-xl text-white"
                        style={{ backgroundColor: color }}
                      >
                        <Icon size={20} />
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold text-ink-900">
                          {cluster.display_name || cluster.name}
                        </h3>
                        {cluster.name && cluster.name !== cluster.display_name && (
                          <Badge tone="neutral" className="mt-1">
                            {cluster.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-ink-900">{share}%</p>
                      <p className="text-xs text-ink-400">of students</p>
                    </div>
                  </div>

                  <p className="mt-4 flex-1 text-sm leading-relaxed text-ink-600">
                    {cluster.description}
                  </p>

                  <div className="mt-4">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-100">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${share}%`, backgroundColor: color }}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-ink-400">{cluster.size} students in this group</p>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Methodology strip */}
          <Card className="mt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Database size={20} />
                </span>
                <div>
                  <p className="font-semibold text-ink-900">Grounded in real data</p>
                  <p className="mt-1 max-w-xl text-sm text-ink-500">
                    These groups come from unsupervised clustering over behavioural signals, then
                    validated for distinctness. Read more about the method and its limits on the
                    About page.
                  </p>
                </div>
              </div>
              <Button as={Link} to="/about" variant="secondary" className="shrink-0">
                How it works <ArrowRight size={16} />
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
