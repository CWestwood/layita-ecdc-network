// src/features/practitioners/index.tsx

import { useMemo, useCallback, useState } from "react";
import { resolveGroupColor, resolveGroupNameShortForm } from "../../lib/Groupcolors";
import { TRAINING_FILTERS } from "../../lib/Trainingfilters";
import { usePractitioners, useGlobalVisitStats } from "./api/usePractitioners";
import { Practitioner } from "./types";
import PractitionerRow  from "./PractitionerRow";
import PractitionerCard from "./PractitionerCard";
import {DetailPanel, DetailEmpty} from "./DetailPanel";
import Sidebar from "../../layouts/Sidebar";
import {
  daysSince,
  trainingCount,
  Icon,
  Icons,
  GridIcon,
  ListIcon,
} from "./_components";
import "../../styles/practitioners.css";

// ─── ../lib ────────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { key: "name_asc",       label: "Name A–Z"         },
  { key: "name_desc",      label: "Name Z–A"         },
  { key: "visit_recent",   label: "Recently visited"  },
  { key: "visit_oldest",   label: "Longest overdue"   },
  { key: "training_most",  label: "Most training"     },
  { key: "training_least", label: "Least training"    },
] as const;

type SortKey = typeof SORT_OPTIONS[number]["key"];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Practitioners() {
  const [selected,        setSelected]        = useState<Practitioner | null>(null);
  const [search,          setSearch]          = useState("");
  const [sortKey,         setSortKey]         = useState<SortKey>("name_asc");
  const [viewMode,        setViewMode]        = useState<"list" | "grid">("list");
  const [activeGroups,    setActiveGroups]    = useState<string[]>([]);
  const [activeTraining,  setActiveTraining]  = useState<string[]>([]);

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: practitioners = [], isLoading: pracLoading  } = usePractitioners();
  const { data: globalVisits  = [], isLoading: visitsLoading } = useGlobalVisitStats();

  const loading = pracLoading || visitsLoading;

  // Build lastVisitMap from the lightweight global stats query
  const lastVisitMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const v of globalVisits) {
      if (!map.has(v.practitioner_id)) {
        map.set(v.practitioner_id, v.date);
      }
    }
    return map;
  }, [globalVisits]);

  // ── Derived data ──────────────────────────────────────────────────────────
  const allGroups = useMemo(() => {
    const seen = new Set<string>();
    return practitioners
      .map((p) => p.group?.group_name)
      .filter((g): g is string => !!g && !seen.has(g) && !!seen.add(g))
      .sort((a, b) => a.localeCompare(b));
  }, [practitioners]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    const list = practitioners.filter((p) => {
      const matchSearch   = !q
        || p.name?.toLowerCase().includes(q)
        || p.ecdc?.name?.toLowerCase().includes(q)
        || p.group?.group_name?.toLowerCase().includes(q);
      const matchGroup    = activeGroups.length === 0 || activeGroups.includes(p.group?.group_name ?? "");
        const matchTraining = activeTraining.length === 0 || activeTraining.every((k) => p.training?.[k] === true);
      return matchSearch && matchGroup && matchTraining;
    });

    return [...list].sort((a, b) => {
      switch (sortKey) {
        case "name_asc":       return (a.name || "").localeCompare(b.name || "");
        case "name_desc":      return (b.name || "").localeCompare(a.name || "");
        case "visit_recent":   return daysSince(lastVisitMap.get(a.id)) - daysSince(lastVisitMap.get(b.id));
        case "visit_oldest":   return daysSince(lastVisitMap.get(b.id)) - daysSince(lastVisitMap.get(a.id));
        case "training_most":  return trainingCount(b) - trainingCount(a);
        case "training_least": return trainingCount(a) - trainingCount(b);
        default: return 0;
      }
    });
  }, [practitioners, search, activeGroups, activeTraining, sortKey, lastVisitMap]);

  const stats = useMemo(() => ({
    total:   practitioners.length,
    showing: filtered.length,
    onTrack: filtered.filter((p) => daysSince(lastVisitMap.get(p.id)) <= 180).length,
    overdue: filtered.filter((p) => {
      const d = daysSince(lastVisitMap.get(p.id));
      return d > 180 && d !== Infinity;
    }).length,
    never: filtered.filter((p) => !lastVisitMap.has(p.id)).length,
  }), [practitioners, filtered, lastVisitMap]);

  // ── Event handlers ────────────────────────────────────────────────────────
  const toggleGroup    = useCallback((g: string) =>
    setActiveGroups((prev) => prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]), []);

  const toggleTraining = useCallback((k: string) =>
    setActiveTraining((prev) => prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]), []);

  const clearFilters   = useCallback(() => { setActiveGroups([]); setActiveTraining([]); }, []);

  const handleSelect   = useCallback((p: Practitioner) =>
    setSelected((prev) => prev?.id === p.id ? null : p), []);

  const anyFilters = activeGroups.length > 0 || activeTraining.length > 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p2-page">
      <Sidebar />

      <div className="p2-main">

        {/* ── Top bar ── */}
        <header className="p2-topbar">
          <h1 className="p2-topbar__title">Practitioners</h1>

          <div className="p2-topbar__controls">
            <div className="p2-search">
              <svg className="p2-search__icon" width="13" height="13" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                className="p2-search__input"
                placeholder="Search name, ECDC, group…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="p2-search__clear" onClick={() => setSearch("")}>
                  <Icon d={Icons.x} size={11} />
                </button>
              )}
            </div>

            <select
              className="p2-select"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              aria-label="Sort by"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>

            {/*<div className="p2-view-toggle" role="group" aria-label="View mode">
              <button
                className={`p2-view-btn ${viewMode === "list" ? "p2-view-btn--active" : ""}`}
                onClick={() => setViewMode("list")}
                title="List view"
              ><ListIcon /></button>
              <button
                className={`p2-view-btn ${viewMode === "grid" ? "p2-view-btn--active" : ""}`}
                onClick={() => setViewMode("grid")}
                title="Grid view"
              ><GridIcon /></button>
            </div> */}
          </div>
        </header>

        {/* ── Filter bar ── */}
        <div className="p2-filters" role="toolbar" aria-label="Filters">
          <span className="p2-filters__label">Groups</span>

          {allGroups.map((g) => {
            const c = resolveGroupColor(g);
            return (
              <button
                key={g}
                className={`p2-chip ${activeGroups.includes(g) ? "p2-chip--active" : ""}`}
                onClick={() => toggleGroup(g)}
                style={{ "--chip-color": c.fill } as React.CSSProperties}
              >
                <span className="p2-chip__dot" style={{ background: c.fill }} />
                {resolveGroupNameShortForm(g)}
              </button>
            );
          })}
          </div>

          <div className="p2-filters" role="toolbar" aria-label="Filters">
          
          <span className="p2-filters__label">Training</span>

          {TRAINING_FILTERS.map((f) => (
            <button
              key={f.key}
              className={`p2-chip ${activeTraining.includes(f.key) ? "p2-chip--active" : ""}`}
              onClick={() => toggleTraining(f.key)}
            >
              {f.label}
            </button>
          ))}

          {anyFilters && (
            <button className="p2-chip p2-chip--clear" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>

        {/* ── Stats strip ── */}
        <div className="p2-stats" role="region" aria-label="Summary statistics">
          {([
            { value: stats.total,   label: "Total",          color: null      },
            { value: stats.showing, label: "Showing",        color: null      },
            { value: stats.onTrack, label: "On track",       color: "success" },
            { value: stats.overdue, label: "Overdue (>6mo)", color: "warning" },
            { value: stats.never,   label: "Never visited",  color: "danger"  },
          ] as const).map(({ value, label, color }) => (
            <div key={label} className="p2-stat">
              <div className="p2-stat__label">{label}</div>
              <div className={`p2-stat__value ${color ? `p2-stat__value--${color}` : ""}`}>
                {value}
              </div>
              
            </div>
          ))}
        </div>

        {/* ── Body ── */}
        <div className="p2-body">

          {/* List / grid panel */}
          <div className={`p2-list-panel ${selected ? "" : "p2-list-panel--full"}`}>
            {loading ? (
              <div className="p2-loading">
                <div className="p2-spinner" />
                Loading practitioners…
              </div>
            ) : filtered.length === 0 ? (
              <div className="p2-empty">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <p>No practitioners match your current filters.</p>
                {anyFilters && (
                  <button className="p2-chip p2-chip--clear" onClick={clearFilters}>
                    Clear filters
                  </button>
                )}
              </div>
            ) : viewMode === "list" ? (
              <>
                <div className="p2-list-header">
                  <div>Name / Group</div>
                  <div>ECDC</div>
                  <div>Last Visit</div>
                  <div>Training</div>
                  <div>Flags</div>
                </div>
                <div className="p2-list-scroll">
                  {filtered.map((p) => (
                    <PractitionerRow
                      key={p.id}
                      p={p}
                      selected={selected}
                      lastVisit={lastVisitMap.get(p.id)}
                      onClick={() => handleSelect(p)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="p2-grid-scroll">
                <div className="p2-grid">
                  {filtered.map((p) => (
                    <PractitionerCard
                      key={p.id}
                      p={p}
                      selected={selected}
                      lastVisit={lastVisitMap.get(p.id)}
                      onClick={() => handleSelect(p)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Detail panel */}
          <div className={`p2-detail-panel ${selected ? "p2-detail-panel--open" : ""}`}>
            {selected
              ? <DetailPanel p={selected} onClose={() => setSelected(null)} />
              : <DetailEmpty />
            }
          </div>

        </div>
      </div>
    </div>
  );
}