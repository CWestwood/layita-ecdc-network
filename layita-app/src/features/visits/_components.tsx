// src/features/visits/_components.tsx
// ─── Atoms, icons, and pure helpers for the OutreachVisits page ───────────────

import { VisitRow } from './api/useVisits';

// ─── Constants ────────────────────────────────────────────────────────────────

export const HAPPENED_COLORS = {
  yes:         { text: '#1e7e44', bg: 'rgba(30,126,68,0.1)',   label: 'Happened'        },
  no:          { text: '#c0392b', bg: 'rgba(192,57,43,0.1)',   label: 'Did not happen'  },
  rescheduled: { text: '#956c00', bg: 'rgba(149,108,0,0.1)',   label: 'Rescheduled'     },
  default:     { text: '#637381', bg: 'rgba(99,115,129,0.1)',  label: '—'               },
} as const;

type HappenedKey = keyof typeof HAPPENED_COLORS;

export const resolveHappened = (val: string | null | undefined) => {
  if (!val) return HAPPENED_COLORS.default;
  const key = val.toLowerCase().trim() as HappenedKey;
  return HAPPENED_COLORS[key] ?? HAPPENED_COLORS.default;
};

// ─── Date helpers ─────────────────────────────────────────────────────────────

export const fmtDate = (isoStr: string | null | undefined): string => {
  if (!isoStr) return '—';
  const d = new Date(isoStr + 'T00:00:00');
  if (isNaN(d.getTime())) return '—';
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
};

export const fmtMonth = (isoStr: string | null | undefined): string | null => {
  if (!isoStr) return null;
  const d = new Date(isoStr + 'T00:00:00');
  return d.toLocaleString('default', { month: 'long', year: 'numeric' });
};

// ─── Group visits by month ────────────────────────────────────────────────────

export interface VisitGroup {
  month: string;
  visits: VisitRow[];
}

export const groupByMonth = (visits: VisitRow[]): VisitGroup[] => {
  const groups: VisitGroup[] = [];
  let currentMonth: string | null = null;
  let currentGroup: VisitRow[] = [];

  for (const v of visits) {
    const month = fmtMonth(v.date) ?? 'Unknown date';
    if (month !== currentMonth) {
      if (currentGroup.length > 0) groups.push({ month: currentMonth!, visits: currentGroup });
      currentMonth = month;
      currentGroup = [v];
    } else {
      currentGroup.push(v);
    }
  }
  if (currentGroup.length > 0) groups.push({ month: currentMonth!, visits: currentGroup });
  return groups;
};

// ─── Icons ────────────────────────────────────────────────────────────────────

interface IconProps extends React.SVGProps<SVGSVGElement> {
  d: string;
  size?: number;
}

export const Icon = ({ d, size = 14, ...props }: IconProps) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    {...props}
  >
    <path d={d} />
  </svg>
);

export const CameraIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

export const PersonIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);

export const ChevronIcon = ({ dir = 'down' }: { dir?: 'up' | 'down' }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    {dir === 'down'
      ? <polyline points="6 9 12 15 18 9" />
      : <polyline points="6 15 12 9 18 15" />}
  </svg>
);

export const PencilIcon = () => (
   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
     <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
   </svg>
);

export const CloseIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);
