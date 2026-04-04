// src/features/ecdcMap/_components.tsx
// ─── Map-specific atoms, icons, helpers ──────────────────────────────────────

import { useEffect } from 'react';
import {
  useMap,
  Marker   as RLMarker,
  Tooltip  as RLTooltip,
  TileLayer as RLTileLayer,
} from 'react-leaflet';
import type {
  MarkerProps,
  TooltipProps,
  TileLayerProps,
} from 'react-leaflet';
import L from 'leaflet';
import { resolveGroupColor } from '../../lib/Groupcolors';
import type { EcdcPractitioner, EcdcWithPractitioners } from './api/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VisitPreset {
  key: string;
  label: string;
  matchFn: (lastVisit: string | null, now: Date) => boolean;
}

// ─── Visit preset options ─────────────────────────────────────────────────────

export const VISIT_PRESETS: VisitPreset[] = [
  {
    key: 'visit_this_year',
    label: 'Visited this year',
    matchFn: (lastVisit, now) => {
      if (!lastVisit) return false;
      return lastVisit >= `${now.getFullYear()}-01-01`;
    },
  },
  {
    key: 'this_year',
    label: 'Not visited this year',
    matchFn: (lastVisit, now) => {
      if (!lastVisit) return true;
      return lastVisit < `${now.getFullYear()}-01-01`;
    },
  },
  {
    key: '6months',
    label: 'More than 6 months ago',
    matchFn: (lastVisit, now) => {
      if (!lastVisit) return true;
      const cutoff = new Date(now);
      cutoff.setMonth(cutoff.getMonth() - 6);
      return lastVisit < cutoff.toISOString().slice(0, 10);
    },
  },
  {
    key: '1year',
    label: 'More than 1 year ago',
    matchFn: (lastVisit, now) => {
      if (!lastVisit) return true;
      const cutoff = new Date(now);
      cutoff.setFullYear(cutoff.getFullYear() - 1);
      return lastVisit < cutoff.toISOString().slice(0, 10);
    },
  },
  {
    key: 'never',
    label: 'No recorded visits',
    matchFn: (lastVisit) => !lastVisit,
  },
];

// ─── Pure helpers ─────────────────────────────────────────────────────────────

export const fmtDate = (isoStr: string | null | undefined): string | null => {
  if (!isoStr) return null;
  const d = new Date(isoStr + 'T00:00:00');
  if (isNaN(d.getTime())) return null;
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
};

export const dominantGroupName = (practitioners: EcdcPractitioner[] | undefined): string | null => {
  if (!practitioners?.length) return null;
  const counts: Record<string, number> = {};
  for (const p of practitioners) {
    const name = p.group?.group_name ?? null;
    if (!name) continue;
    counts[name] = (counts[name] ?? 0) + 1;
  }
  const entries = Object.entries(counts);
  if (!entries.length) return null;
  entries.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return entries[0][0];
};

export const isPractitionerOverdue = (
  practitionerId: string,
  visitPreset: string | null,
  lastVisitMap: Map<string, string> | null,
): boolean => {
  if (!visitPreset || !lastVisitMap) return false;
  const preset = VISIT_PRESETS.find((p) => p.key === visitPreset);
  if (!preset) return false;
  return preset.matchFn(lastVisitMap.get(practitionerId) ?? null, new Date());
};

// ─── Custom ECDC marker icon ──────────────────────────────────────────────────

export const createCustomIcon = (isSelected: boolean, groupName: string | null): L.DivIcon => {
  const c    = resolveGroupColor(groupName);
  const size = isSelected ? 18 : 10;
  const fill   = isSelected ? '#ffffff' : c.fill;
  const border = isSelected ? c.fill    : '#ffffff';
  const glow   = isSelected ? c.glow    : 'rgba(0,0,0,0.18)';

  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${fill};
      border:2.5px solid ${border};
      border-radius:50%;
      box-shadow:0 1px ${isSelected ? 8 : 4}px ${glow};
      transition:all 0.2s ease;
    "></div>`,
    iconAnchor: [size / 2, size / 2],
  });
};

// ─── Landmark marker icon ─────────────────────────────────────────────────────

interface Landmark {
  name?: string | null;
  type?: string | null;
}

export const getLandmarkIcon = (lm: Landmark): L.DivIcon => {
  const t = (lm?.type || '').toLowerCase();
  let svg = '';

  if (t === 'clinic') {
    svg = `<svg fill="#1990c4" version="1.1" xmlns="http://www.w3.org/2000/svg"
        width="20" height="20" viewBox="0 0 50.596 49.994" xml:space="preserve">
      <path d="M48.648,15.387H35.026V1.925C35.026,0.862,34.159,0,33.083,0H17.512c-1.074,0-1.941,0.862-1.941,1.925v13.461H1.948
        C0.873,15.387,0,16.245,0,17.307v15.385c0,1.062,0.873,1.916,1.947,1.916h13.623v13.463c0,1.06,0.867,1.923,1.941,1.923h15.571
        c1.075,0,1.941-0.863,1.941-1.923V34.608h13.622c1.075,0,1.948-0.854,1.948-1.916V17.307C50.596,16.245,49.723,15.387,48.648,15.387z"/>
    </svg>`;
  } else if (t === 'hospital') {
    svg = `<svg width="18" height="18" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
      <path d="M56.609 1.114s-48.788-.015-48.774 0C3.338 1.114.81 3.439.81 8.188v48.966c0 4.443 2.273 6.769 6.766 6.769h49.173c4.493 0 6.769-2.21 6.769-6.769V8.188c.001-4.634-2.275-7.074-6.909-7.074zm-8.343 52.518h-8.302v-17.82H24.469v17.82h-8.301V13.896h8.301v15.053h15.495V13.896h8.302v39.736z" fill="#c0392b"/>
    </svg>`;
  } else if (t === 'ngo') {
    svg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fc8438" stroke-width="2" stroke-linejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke-linecap="round"/>
    </svg>`;
  } else {
    svg = `<svg width="18" height="18" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <rect width="16" height="16" fill="#1e7e44"/>
      <path fill="#ffffff" d="M0,8v7h3v-4h3v4h6V8L6,3L0,8z M10,1L7.6,3L13,7.5V13h3V6L10,1z"/>
    </svg>`;
  }

  return L.divIcon({
    className: 'landmark-icon',
    html: `<div style="display:flex;align-items:center;justify-content:center;filter:drop-shadow(0px 1px 3px rgba(0,0,0,0.25));">
      ${svg}
      <div style="position:absolute;top:22px;background:rgba(255,255,255,0.92);color:#1a2027;font-size:0.5rem;font-family:'Raleway',sans-serif;padding:1px 4px;border-radius:3px;white-space:nowrap;pointer-events:none;border:1px solid #d1d9e0;">
        ${lm?.name || 'Landmark'}
      </div>
    </div>`,
    iconSize: [16, 16],
    iconAnchor: [10, 10],
  });
};

// ─── FlyToSelected ────────────────────────────────────────────────────────────

interface FlyToSelectedProps {
  location: { latitude: number; longitude: number } | null;
}

export function FlyToSelected({ location }: FlyToSelectedProps) {
  const map = useMap();
  useEffect(() => {
    if (location) map.flyTo([location.latitude, location.longitude], 13, { duration: 0.9 });
  }, [location, map]);
  return null;
}

// ─── PhoneIcon ────────────────────────────────────────────────────────────────

export const PhoneIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.57 3.24 2 2 0 0 1 3.54 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.5a16 16 0 0 0 6 6l.87-.87a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.5 16z" />
  </svg>
);

// ─── Typed react-leaflet wrappers ─────────────────────────────────────────────
//
// react-leaflet's TypeScript definitions sometimes diverge from leaflet's own
// types (e.g. `icon`, `offset`, `attribution`). These thin wrappers absorb the
// cast in one place so call sites stay clean.

interface MapMarkerProps extends Omit<MarkerProps, 'icon'> {
  icon?: L.Icon | L.DivIcon;
  children?: React.ReactNode;
}

export function MapMarker({ icon, children, ...rest }: MapMarkerProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <RLMarker icon={icon as any} {...(rest as any)}>{children}</RLMarker>;
}

interface MapTooltipProps extends Omit<TooltipProps, 'offset'> {
  offset?: [number, number] | L.PointExpression;
  children?: React.ReactNode;
  className?: string;
  direction?: 'auto' | 'center' | 'top' | 'bottom' | 'left' | 'right';
}

export function MapTooltip({ offset, children, ...rest }: MapTooltipProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <RLTooltip offset={offset as any} {...(rest as any)}>{children}</RLTooltip>;
}

interface MapTileLayerProps extends Omit<TileLayerProps, 'attribution'> {
  attribution?: string;
  opacity?: number;
}

export function MapTileLayer({ attribution, opacity, ...rest }: MapTileLayerProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <RLTileLayer attribution={attribution as any} opacity={opacity} {...(rest as any)} />;
}

export const CloseIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);