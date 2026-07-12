import { Users } from 'lucide-react';
import Badge from '../ui/Badge';

// Shows which behavioural group a student's habits resemble. We lead with the
// softer display name and keep the raw cluster label as a small tag, so the
// student sees the friendly framing first without us hiding the underlying model.
export default function ClusterCard({ cluster }) {
  if (!cluster) return null;
  const { display_name, name, description } = cluster;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
          <Users size={20} />
        </span>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">
            Your bearing
          </p>
          <h3 className="text-lg font-semibold text-ink-900">{display_name || name}</h3>
        </div>
      </div>

      <p className="flex-1 text-sm leading-relaxed text-ink-600">{description}</p>

      {name && display_name && name !== display_name && (
        <div className="mt-4">
          <Badge tone="brand">Model label: {name}</Badge>
        </div>
      )}
    </div>
  );
}
