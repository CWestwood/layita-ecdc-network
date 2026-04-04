// src/features/visits/index.tsx

import { useMemo, useState } from 'react';
import { themeColors as t } from '../../lib/layita_colors';
import { useVisits, VisitRow } from './api/useVisits';
import Sidebar from '../../layouts/Sidebar';
import VisitRowComponent from './Visitrow';
import VisitDetail from './Visitdetail';
import {
  fmtMonth,
  groupByMonth,
  resolveHappened,
  ChevronIcon,
} from './_components';

import '../../styles/shared.css';
import '../../styles/outreachVisits.css';

// ─── Types ────────────────────────────────────────────────────────────────────

type SortDir  = 'asc' | 'desc';
type DateRange = 'all' | '7d' | '30d' | '90d' | '1y';

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OutreachVisits() {
  const [selected,       setSelected]       = useState<VisitRow | null>(null);
  const [search,         setSearch]         = useState('');
  const [sortDir,        setSortDir]        = useState<SortDir>('desc');
  const [activeTypes,    setActiveTypes]    = useState<string[]>([]);
  const [activeHappened, setActiveHappened] = useState<string[]>([]);
  const [dateRange,      setDateRange]      = useState<DateRange>('all');

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: visits = [], isLoading: loading } = useVisits();

  // ── Derived ───────────────────────────────────────────────────────────────
  const dateRangeStart = useMemo(() => {
    const now = new Date();
    switch (dateRange) {
      case '7d':  { const d = new Date(now); d.setDate(d.getDate() - 7);          return d.toISOString().slice(0, 10); }
      case '30d': { const d = new Date(now); d.setDate(d.getDate() - 30);         return d.toISOString().slice(0, 10); }
      case '90d': { const d = new Date(now); d.setDate(d.getDate() - 90);         return d.toISOString().slice(0, 10); }
      case '1y':  { const d = new Date(now); d.setFullYear(d.getFullYear() - 1);  return d.toISOString().slice(0, 10); }
      default: return null;
    }
  }, [dateRange]);

  const allTypes = useMemo(() => {
    const seen = new Set<string>();
    visits.forEach((v) => { if (v.outreach_type) seen.add(v.outreach_type); });
    return Array.from(seen).sort();
  }, [visits]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();

    const list = visits.filter((v) => {
      const matchSearch =
        !q ||
        v.practitioner?.name?.toLowerCase().includes(q) ||
        v.outreach_type?.toLowerCase().includes(q) ||
        v.comments?.toLowerCase().includes(q);

      const matchType    = activeTypes.length === 0 || activeTypes.includes(v.outreach_type ?? '');
      const matchHap     = activeHappened.length === 0 || activeHappened.includes(
        v.outreach_happened?.toLowerCase()?.trim() ?? 'null'
      );
      const matchDate    = !dateRangeStart || (v.date != null && v.date >= dateRangeStart);

      return matchSearch && matchType && matchHap && matchDate;
    });

    return [...list].sort((a, b) => {
      const da = a.date ?? '', db = b.date ?? '';
      return sortDir === 'desc' ? db.localeCompare(da) : da.localeCompare(db);
    });
  }, [visits, search, activeTypes, activeHappened, dateRangeStart, sortDir]);

  const grouped = useMemo(() => groupByMonth(filtered), [filtered]);

  const stats = useMemo(() => ({
    total:        filtered.length,
    happened:     filtered.filter((v) => v.outreach_happened?.toLowerCase() === 'yes').length,
    totalParents: filtered.reduce((s, v) => s + (Number(v.parents_trained)  || 0), 0),
    totalBooks:   filtered.reduce((s, v) => s + (Number(v.children_books)   || 0), 0),
    totalKm:      filtered.reduce((s, v) => s + (Number(v.transport_km)     || 0), 0),
    totalCost:    filtered.reduce((s, v) => s + (Number(v.transport_cost)   || 0), 0),
  }), [filtered]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const toggleType = (type: string) =>
    setActiveTypes((prev) => prev.includes(type) ? prev.filter((x) => x !== type) : [...prev, type]);

  const toggleHap = (h: string) =>
    setActiveHappened((prev) => prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h]);

  const handleSelect = (v: VisitRow) =>
    setSelected((prev) => prev?.id === v.id ? null : v);

  const clearFilters = () => { setActiveTypes([]); setActiveHappened([]); setDateRange('all'); };

  const anyFilters = activeTypes.length > 0 || activeHappened.length > 0 || dateRange !== 'all';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="page">
      <Sidebar />

      <div className="ov-main">

        {/* ── Topbar ── */}
        <div className="ov-topbar">
          <div className="ov-topbar__title">Outreach Visits</div>
          <div className="ov-topbar__controls">

            <div className="ov-search-wrap">
              <svg className="ov-search-icon" width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                className="ov-search-input"
                placeholder="Search practitioner, type…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="ov-select"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
            >
              <option value="all">All time</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>

            <button
              className="ov-select"
              style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}
              onClick={() => setSortDir((d) => d === 'desc' ? 'asc' : 'desc')}
            >
              {sortDir === 'desc' ? 'Newest first' : 'Oldest first'}
              <ChevronIcon dir={sortDir === 'desc' ? 'down' : 'up'} />
            </button>

          </div>
        </div>

        {/* ── Filter bar ── */}
        <div className="ov-filterbar">
          <span className="ov-filter-label">Type</span>
          {allTypes.map((type) => (
            <div
              key={type}
              className={`ov-chip${activeTypes.includes(type) ? ' ov-chip--active' : ''}`}
              onClick={() => toggleType(type)}
            >
              {type}
            </div>
          ))}

          <div className="ov-divider" />
          <span className="ov-filter-label">Status</span>

          {([
            { key: 'yes', label: 'Happened'       },
            { key: 'no',  label: 'Did not happen' },
          ] as const).map(({ key, label }) => (
            <div
              key={key}
              className={`ov-chip${activeHappened.includes(key) ? ' ov-chip--active' : ''}`}
              onClick={() => toggleHap(key)}
            >
              {label}
            </div>
          ))}

          {anyFilters && (
            <button className="ov-filter-clear" onClick={clearFilters}>
              Clear all
            </button>
          )}
        </div>

        {/* ── Stats strip ── */}
        <div className="ov-stats">
          {([
            { value: stats.total,                                          label: 'Visits shown'       },
            { value: stats.happened,                                       label: 'Completed',          color: t.success },
            { value: stats.totalParents,                                   label: 'Parents trained'    },
            { value: stats.totalBooks,                                     label: 'Books distributed'  },
            { value: `${Math.round(stats.totalKm)} km`,                    label: 'Total distance'     },
            { value: `R${Math.round(stats.totalCost).toLocaleString()}`,   label: 'Transport cost'     },
          ] as const).map((stat) => (
            <div key={stat.label} className="ov-stat">
              <div
                className="ov-stat__value"
                style={'color' in stat && stat.color ? { color: stat.color } : undefined}
              >
                {stat.value}
              </div>
              <div className="ov-stat__label">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ── Body ── */}
        <div className="ov-body">

          {/* List panel */}
          <div className={`ov-list-panel${!selected ? ' ov-list-panel--expanded' : ''}`}>
            {loading ? (
              <div className="ov-loading">
                <div className="spinner spinner--md" /> Loading visits…
              </div>
            ) : (
              <div className="ov-list-scroll">
                {filtered.length === 0 ? (
                  <div className="ov-no-results">No visits match your filters.</div>
                ) : (
                  <>
                    <div className="ov-list-header">
                      <div style={{ textAlign: 'center' }}>Date</div>
                      <div style={{ textAlign: 'center' }}>Practitioner</div>
                      <div style={{ textAlign: 'center' }}>Type</div>
                      <div style={{ textAlign: 'center' }}>Status</div>
                      <div style={{ textAlign: 'center' }}>Parents</div>
                      <div style={{ textAlign: 'center' }}>Books</div>
                      <div style={{ textAlign: 'center' }}>Distance</div>
                      <div style={{ textAlign: 'center' }}>Notes</div>
                    </div>
                    {grouped.map(({ month, visits: gv }) => (
                      <div key={month}>
                        <div className="ov-month-header">
                          {month}
                          <span className="ov-month-header__count">{gv.length}</span>
                        </div>
                        {gv.map((v) => (
                          <VisitRowComponent
                            key={v.id}
                            v={v}
                            isSelected={selected?.id === v.id}
                            onClick={() => handleSelect(v)}
                          />
                        ))}
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="ov-detail-panel ov-detail-panel--open">
              <VisitDetail visit={selected} onClose={() => setSelected(null)} />
            </div>
          )}

        </div>
      </div>
    </div>
  );
}