import { useEffect, useState, useMemo } from "react";
import { NavLink } from "react-router-dom";
import { supabase } from "../services/supabaseClient";
import { themeColors } from "../constants/layita_colors";
import logo from '../assets/layitalogo.svg';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const OUTREACH_TYPES = [
  "Home Visit",
  "Group Session",
  "Phone Call",
  "Update",
  "Other",
];

const HAPPENED_COLORS = {
  yes:        { text: "#1e7e44", bg: "rgba(30,126,68,0.1)",   label: "Happened" },
  no:         { text: "#c0392b", bg: "rgba(192,57,43,0.1)",  label: "Did not happen" },
  rescheduled:{ text: "#956c00", bg: "rgba(149,108,0,0.1)",  label: "Rescheduled" },
  default:    { text: "#637381", bg: "rgba(99,115,129,0.1)", label: "—" },
};

const resolveHappened = (val) => {
  if (!val) return HAPPENED_COLORS.default;
  const k = val.toLowerCase().trim();
  return HAPPENED_COLORS[k] ?? HAPPENED_COLORS.default;
};

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR NAV ITEMS
// ─────────────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  {
    to: "/practitioners", label: "Practitioners",
    icon: <svg style={{width:16,height:16,flexShrink:0}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.87"/></svg>,
  }, 
  {
    to: "/ecdc-list", label: "ECDC Map",
    icon: <svg style={{width:16,height:16,flexShrink:0}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  },
  {
    to: "/outreach-visits", label: "Outreach Visits",
    icon: <svg style={{width:16,height:16,flexShrink:0}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const fmtDate = (isoStr) => {
  if (!isoStr) return "—";
  const d = new Date(isoStr + "T00:00:00");
  if (isNaN(d.getTime())) return "—";
  return `${String(d.getDate()).padStart(2,"0")}-${String(d.getMonth()+1).padStart(2,"0")}-${d.getFullYear()}`;
};

const fmtMonth = (isoStr) => {
  if (!isoStr) return null;
  const d = new Date(isoStr + "T00:00:00");
  return d.toLocaleString("default", { month: "long", year: "numeric" });
};

const fmt = (n, unit = "") => (n != null && n !== "" ? `${n}${unit}` : null);

// ─────────────────────────────────────────────────────────────────────────────
// ICONS
// ─────────────────────────────────────────────────────────────────────────────
const CalIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);
const PersonIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
);
const BookIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);
const CarIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-2"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="17.5" cy="17.5" r="1.5"/>
  </svg>
);
const CameraIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
  </svg>
);
const FilterIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
);
const ChevronIcon = ({ dir = "down" }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    {dir === "down" ? <polyline points="6 9 12 15 18 9"/> : <polyline points="6 15 12 9 18 15"/>}
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────
const t = themeColors;

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=DM+Sans:wght@400;500;600;700&display=swap');

  * { box-sizing: border-box; }

  .ov-page {
    display: flex;
    height: 100vh; width: 100vw;
    overflow: hidden;
    position: fixed; top: 0; left: 0;
    background: ${t.background};
    color: ${t.text};
    font-family: 'DM Sans', sans-serif;
  }

  /* ── Sidebar ── */
  .ov-sidebar {
    width: 250px; min-width: 250px;
    background: ${t.bgSubtle};
    border-right: 1px solid ${t.border};
    height: 100vh;
    display: flex; flex-direction: column;
    z-index: 200; flex-shrink: 0; overflow: hidden;
    transition: width 0.28s cubic-bezier(0.4,0,0.2,1), min-width 0.28s cubic-bezier(0.4,0,0.2,1);
  }
  .ov-sidebar.collapsed { width: 56px; min-width: 56px; }

  .ov-sidebar-top {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 12px;
    border-bottom: 1px solid ${t.border};
    flex-shrink: 0; min-height: 58px;
    background: ${t.background};
  }
  .ov-sidebar-logo { width: 80px; opacity: 1; transition: opacity 0.15s, width 0.28s; }
  .ov-sidebar.collapsed .ov-sidebar-logo { width: 0; opacity: 0; pointer-events: none; }

  .ov-collapse-btn {
    background: none; border: 1px solid ${t.border}; border-radius: 6px;
    color: ${t.textMuted}; cursor: pointer; padding: 5px 6px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    transition: color 0.15s, border-color 0.15s, background 0.15s;
  }
  .ov-sidebar.collapsed .ov-collapse-btn { margin: 0 auto; }
  .ov-collapse-btn:hover { color: ${t.primaryDeep}; border-color: ${t.primary}; background: ${t.primaryTint08}; }

  .ov-sidebar-nav { flex: 1; padding: 10px 8px; overflow: hidden; }
  .ov-sidebar-nav ul { list-style: none; padding: 0; margin: 0; }
  .ov-sidebar-nav li { margin-bottom: 2px; position: relative; }
  .ov-sidebar-nav a {
    color: ${t.textSecondary}; text-decoration: none;
    display: flex; align-items: center; gap: 10px;
    padding: 9px 10px; border-radius: 7px;
    font-size: 0.85rem; font-weight: 500;
    white-space: nowrap; overflow: hidden;
    transition: background 0.15s, color 0.15s;
  }
  .ov-sidebar-nav a:hover { background: ${t.bgHover}; color: ${t.text}; }
  .ov-sidebar-nav a.active { background: ${t.primaryTint15}; color: ${t.primaryDeep}; font-weight: 600; }
  .ov-nav-label { opacity: 1; transition: opacity 0.15s; overflow: hidden; }
  .ov-sidebar.collapsed .ov-nav-label { opacity: 0; width: 0; pointer-events: none; }
  .ov-sidebar.collapsed .ov-sidebar-nav a::after {
    content: attr(data-tooltip);
    position: absolute; left: calc(100% + 10px); top: 50%; transform: translateY(-50%);
    background: ${t.background}; border: 1px solid ${t.border}; color: ${t.text};
    font-size: 0.75rem; padding: 4px 10px; border-radius: 6px; white-space: nowrap;
    opacity: 0; pointer-events: none; transition: opacity 0.15s; z-index: 9999;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }
  .ov-sidebar.collapsed .ov-sidebar-nav a:hover::after { opacity: 1; }

  /* ── Main ── */
  .ov-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; height: 100vh; }

  /* ── Topbar ── */
  .ov-topbar {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 24px; height: 58px; flex-shrink: 0;
    background: ${t.background}; border-bottom: 1px solid ${t.border}; gap: 16px;
  }
  .ov-topbar-title {
    font-family: 'Space Mono', monospace;
    font-size: 0.95rem; font-weight: 700;
    color: ${t.text}; text-transform: uppercase; letter-spacing: 0.06em; white-space: nowrap;
  }
  .ov-topbar-controls { display: flex; align-items: center; gap: 10px; flex: 1; justify-content: flex-end; }

  .ov-search-wrap { position: relative; width: 240px; }
  .ov-search-input {
    width: 100%; padding: 7px 12px 7px 30px;
    background: ${t.bgSunken}; border: 1px solid ${t.border}; border-radius: 7px;
    font-family: 'DM Sans', sans-serif; font-size: 0.83rem;
    outline: none; transition: border-color 0.15s; color: ${t.text};
  }
  .ov-search-input::placeholder { color: ${t.textDisabled}; }
  .ov-search-input:focus { border-color: ${t.primary}; background: ${t.background}; box-shadow: 0 0 0 3px ${t.primaryTint15}; }
  .ov-search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: ${t.textMuted}; pointer-events: none; }

  .ov-select {
    padding: 6px 10px; border: 1px solid ${t.border}; border-radius: 7px;
    background: ${t.bgSunken}; color: ${t.textSecondary};
    font-family: 'DM Sans', sans-serif; font-size: 0.8rem; font-weight: 500;
    outline: none; cursor: pointer; transition: border-color 0.15s;
  }
  .ov-select:focus { border-color: ${t.primary}; }

  /* ── Filter bar ── */
  .ov-filterbar {
    display: flex; align-items: center; gap: 8px; padding: 8px 24px;
    background: ${t.bgSubtle}; border-bottom: 1px solid ${t.border};
    overflow-x: auto; flex-shrink: 0;
  }
  .ov-filterbar::-webkit-scrollbar { height: 3px; }
  .ov-filterbar::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 2px; }

  .ov-filter-label {
    font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.07em; color: ${t.textMuted}; white-space: nowrap; flex-shrink: 0; margin-right: 4px;
  }
  .ov-chip {
    display: flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 20px;
    border: 1.5px solid ${t.border}; background: ${t.background};
    font-size: 0.75rem; font-weight: 500; color: ${t.textSecondary};
    cursor: pointer; white-space: nowrap; flex-shrink: 0; user-select: none;
    transition: border-color 0.15s, color 0.15s, background 0.15s;
  }
  .ov-chip:hover { border-color: ${t.primary}; color: ${t.primaryDeep}; background: ${t.primaryTint08}; }
  .ov-chip.active { border-color: ${t.primaryDeep}; background: ${t.primaryTint25}; color: ${t.primaryDeep}; font-weight: 600; }
  .ov-divider { width: 1px; height: 20px; background: ${t.border}; flex-shrink: 0; margin: 0 2px; }
  .ov-filter-clear {
    padding: 4px 10px; border-radius: 20px; border: 1.5px dashed ${t.border};
    background: none; color: ${t.textMuted}; font-family: 'DM Sans', sans-serif;
    font-size: 0.74rem; font-weight: 500; cursor: pointer; white-space: nowrap; flex-shrink: 0;
    transition: border-color 0.15s, color 0.15s;
  }
  .ov-filter-clear:hover { border-color: ${t.danger}; color: ${t.danger}; }

  /* ── Stats strip ── */
  .ov-stats {
    display: flex; gap: 0; border-bottom: 1px solid ${t.border};
    flex-shrink: 0; background: ${t.background};
  }
  .ov-stat {
    flex: 1; padding: 10px 20px; display: flex; flex-direction: column; gap: 1px;
    border-right: 1px solid ${t.border};
  }
  .ov-stat:last-child { border-right: none; }
  .ov-stat-value { font-family: 'Space Mono', monospace; font-size: 1.15rem; font-weight: 700; color: ${t.primaryDeep}; }
  .ov-stat-label { font-size: 0.68rem; color: ${t.textMuted}; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 600; }

  /* ── Body ── */
  .ov-body { display: flex; flex: 1; overflow: hidden; }

  /* ── List panel ── */
  .ov-list-panel {
    flex: 1; display: flex; flex-direction: column; overflow: hidden;
    border-right: 1px solid ${t.border};
    transition: flex 0.25s;
  }
  .ov-list-panel.expanded { border-right: none; }

  .ov-list-scroll { flex: 1; overflow-y: auto; }
  .ov-list-scroll::-webkit-scrollbar { width: 4px; }
  .ov-list-scroll::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 2px; }

  /* ── Month group header ── */
  .ov-month-header {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 24px 6px;
    font-family: 'Space Mono', monospace;
    font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.08em; color: ${t.primaryDeep};
    background: ${t.bgSubtle};
    border-bottom: 1px solid ${t.border};
    position: sticky; top: 0; z-index: 3;
  }
  .ov-month-header-count {
    background: ${t.primaryTint15}; color: ${t.primaryDeep};
    font-size: 0.65rem; padding: 1px 7px; border-radius: 10px; font-weight: 700;
  }

  /* ── Table header ── */
  .ov-list-header {
    display: grid;
    grid-template-columns: 100px 200px 160px 120px 100px 100px 100px 1fr;
    align-items: center; padding: 0 24px; height: 34px;
    background: ${t.bgSubtle}; border-bottom: 1px solid ${t.border};
    font-size: 0.63rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.07em; color: ${t.textMuted}; flex-shrink: 0;
    position: sticky; top: 0; z-index: 2;
  }

  /* ── Visit row ── */
  .ov-row {
    display: grid;
    grid-template-columns: 100px 200px 160px 120px 100px 100px 100px 1fr;
    align-items: center; padding: 0 24px;
    min-height: 50px; border-bottom: 1px solid ${t.bgHover};
    cursor: pointer; background: ${t.background};
    transition: background 0.1s; border-left: 3px solid transparent;
    animation: ov-fadein 0.2s ease;
  }
  .ov-row:hover { background: ${t.bgHover}; }
  .ov-row.selected { background: ${t.primaryTint08}; border-left-color: ${t.primary}; }

  @keyframes ov-fadein { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }

  .ov-row-date { font-family: 'Space Mono', monospace; font-size: 0.72rem; color: ${t.textSecondary}; font-weight: 700; }
  .ov-row-practitioner { font-size: 0.84rem; font-weight: 600; color: ${t.text}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ov-row-prac-ecdc { font-size: 0.7rem; color: ${t.textMuted}; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ov-row-type {
    display: inline-flex; align-items: center; padding: 2px 9px; border-radius: 10px;
    font-size: 0.68rem; font-weight: 600;
    background: ${t.primaryTint15}; color: ${t.primaryDeep};
    white-space: nowrap;
  }
  .ov-row-type.update { background: ${t.bgSunken}; color: ${t.textMuted}; }
  .ov-row-badge {
    display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 10px;
    font-size: 0.68rem; font-weight: 600;
  }
  .ov-row-metric { display: flex; align-items: center; gap: 4px; font-size: 0.78rem; color: ${t.textSecondary}; }
  .ov-row-metric-val { font-weight: 700; color: ${t.text}; font-family: 'Space Mono', monospace; font-size: 0.75rem; }
  .ov-row-metric svg { color: ${t.textMuted}; }
  .ov-row-dash { color: ${t.textDisabled}; font-size: 0.75rem; }
  .ov-row-camera { color: ${t.primary}; display: flex; align-items: center; }
  .ov-row-comment { font-size: 0.72rem; color: ${t.textMuted}; font-style: italic; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  /* ── Detail panel ── */
  .ov-detail-panel {
    width: 380px; min-width: 340px;
    overflow-y: auto; background: ${t.bgSubtle};
    display: flex; flex-direction: column;
    border-left: 1px solid ${t.border};
  }
  .ov-detail-panel::-webkit-scrollbar { width: 4px; }
  .ov-detail-panel::-webkit-scrollbar-thumb { background: ${t.border}; border-radius: 2px; }

  .ov-detail-empty {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 10px;
    color: ${t.textMuted}; font-size: 0.85rem; padding: 40px; text-align: center;
  }
  .ov-detail-empty svg { opacity: 0.3; }

  /* Detail hero */
  .ov-detail-hero {
    background: ${t.background}; border-bottom: 1px solid ${t.border}; padding: 20px 24px;
  }
  .ov-detail-hero-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 14px; }
  .ov-detail-date {
    font-family: 'Space Mono', monospace; font-size: 0.75rem; font-weight: 700;
    color: ${t.textMuted}; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;
  }
  .ov-detail-type-badge {
    display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 10px;
    font-size: 0.75rem; font-weight: 600;
    background: ${t.primaryTint15}; color: ${t.primaryDeep};
  }
  .ov-detail-close {
    background: none; border: none; cursor: pointer;
    color: ${t.textMuted}; font-size: 1rem; line-height: 1; padding: 2px;
  }
  .ov-detail-prac-name {
    font-family: 'Space Mono', monospace; font-size: 1rem; font-weight: 700;
    color: ${t.text}; line-height: 1.3; margin-bottom: 2px;
  }
  .ov-detail-ecdc { font-size: 0.78rem; color: ${t.textMuted}; }

  /* Detail happened */
  .ov-detail-happened {
    margin-top: 14px; display: flex; align-items: center; gap: 8px;
    padding: 8px 12px; border-radius: 8px;
    font-size: 0.78rem; font-weight: 600;
  }
  .ov-did-instead {
    font-size: 0.75rem; margin-top: 6px; color: ${t.textMuted}; font-style: italic;
  }

  /* Detail section */
  .ov-detail-section {
    background: ${t.background}; margin-top: 8px;
    border-top: 1px solid ${t.border}; border-bottom: 1px solid ${t.border};
    padding: 14px 24px;
  }
  .ov-detail-section-title {
    font-size: 0.66rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.08em; color: ${t.primaryDeep};
    margin-bottom: 12px; display: flex; align-items: center; gap: 6px;
  }

  /* Metric grid */
  .ov-metric-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .ov-metric-card {
    padding: 10px 12px; border-radius: 8px;
    background: ${t.bgSubtle}; border: 1px solid ${t.border};
    display: flex; flex-direction: column; gap: 2px;
  }
  .ov-metric-card-label { font-size: 0.62rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: ${t.textMuted}; }
  .ov-metric-card-value { font-family: 'Space Mono', monospace; font-size: 1.05rem; font-weight: 700; color: ${t.text}; }
  .ov-metric-card-value.empty { color: ${t.textDisabled}; font-size: 0.8rem; font-family: 'DM Sans', sans-serif; font-style: italic; }

  .ov-meta-row { display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid ${t.bgHover}; font-size: 0.8rem; }
  .ov-meta-row:last-child { border-bottom: none; }
  .ov-meta-row-label { color: ${t.textMuted}; min-width: 100px; flex-shrink: 0; display: flex; align-items: center; gap: 6px; }
  .ov-meta-row-value { color: ${t.text}; font-weight: 500; }

  .ov-comment-box {
    padding: 10px 12px; background: ${t.bgSunken}; border: 1px solid ${t.border};
    border-radius: 8px; font-size: 0.8rem; color: ${t.textSecondary}; line-height: 1.55;
    font-style: italic;
  }

  /* ── Loading ── */
  .ov-loading { flex: 1; display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 0.88rem; color: ${t.primaryDeep}; font-weight: 600; }
  .ov-spinner { width: 18px; height: 18px; border: 2.5px solid ${t.primaryTint25}; border-top-color: ${t.primary}; border-radius: 50%; animation: ov-spin 0.7s linear infinite; }
  @keyframes ov-spin { to { transform: rotate(360deg); } }

  .ov-no-results { padding: 48px 24px; text-align: center; color: ${t.textMuted}; font-size: 0.85rem; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function OutreachVisits() {
  const [visits, setVisits]             = useState([]);
  const [practitioners, setPractitioners] = useState({});
  const [loading, setLoading]           = useState(true);
  const [selected, setSelected]         = useState(null);
  const [search, setSearch]             = useState("");
  const [sortDir, setSortDir]           = useState("desc"); // "desc" | "asc"
  const [activeTypes, setActiveTypes]   = useState([]);
  const [activeHappened, setActiveHappened] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dateRange, setDateRange]       = useState("all");

  useEffect(() => {
    async function load() {
      const [
        { data: visitData },
        { data: pracData },
      ] = await Promise.all([
        supabase
          .from("outreach_visits")
          .select(`
            id, created_at, date, outreach_type, transport_type, transport_cost, transport_km,
            parents_trained, children_books, books_per_child, books_to_practitioner,
            photos_taken, comments, outreach_happened, did_instead, parents_enrolled,
            practitioner_id,
            data_capturer:data_capturer_id ( id, name )
          `)
          .neq("outreach_type", "Update ECDC Details")
          .order("date", { ascending: false })
          .order("created_at", { ascending: false }),
        supabase
          .from("practitioners")
          .select("id, name, ecdc:ecdc_id ( id, name, area )")
      ]);

      if (visitData) setVisits(visitData);
      if (pracData) {
        const map = {};
        pracData.forEach(p => { map[p.id] = p; });
        setPractitioners(map);
      }
      setLoading(false);
    }
    load();
  }, []);

  // Date range filter
  const dateRangeStart = useMemo(() => {
    const now = new Date();
    switch (dateRange) {
      case "7d":  { const d = new Date(now); d.setDate(d.getDate() - 7); return d.toISOString().slice(0, 10); }
      case "30d": { const d = new Date(now); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); }
      case "90d": { const d = new Date(now); d.setDate(d.getDate() - 90); return d.toISOString().slice(0, 10); }
      case "1y":  { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return d.toISOString().slice(0, 10); }
      default: return null;
    }
  }, [dateRange]);

  // Unique types from data
  const allTypes = useMemo(() => {
    const seen = new Set();
    visits.forEach(v => { if (v.outreach_type) seen.add(v.outreach_type); });
    return [...seen].sort();
  }, [visits]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let list = visits.filter(v => {
      const prac = practitioners[v.practitioner_id];
      const matchSearch = !q ||
        prac?.name?.toLowerCase().includes(q) ||
        prac?.ecdc?.name?.toLowerCase().includes(q) ||
        v.outreach_type?.toLowerCase().includes(q) ||
        v.comments?.toLowerCase().includes(q);

      const matchType = activeTypes.length === 0 || activeTypes.includes(v.outreach_type);

      const matchHappened = activeHappened.length === 0 || activeHappened.includes(v.outreach_happened?.toLowerCase()?.trim() ?? "null");

      const matchDate = !dateRangeStart || (v.date && v.date >= dateRangeStart);

      return matchSearch && matchType && matchHappened && matchDate;
    });

    list = [...list].sort((a, b) => {
      const da = a.date || "";
      const db = b.date || "";
      return sortDir === "desc" ? db.localeCompare(da) : da.localeCompare(db);
    });
    return list;
  }, [visits, practitioners, search, activeTypes, activeHappened, dateRangeStart, sortDir]);

  // Group by month
  const grouped = useMemo(() => {
    const groups = [];
    let currentMonth = null;
    let currentGroup = [];
    filtered.forEach(v => {
      const month = fmtMonth(v.date) || "Unknown date";
      if (month !== currentMonth) {
        if (currentGroup.length > 0) groups.push({ month: currentMonth, visits: currentGroup });
        currentMonth = month;
        currentGroup = [v];
      } else {
        currentGroup.push(v);
      }
    });
    if (currentGroup.length > 0) groups.push({ month: currentMonth, visits: currentGroup });
    return groups;
  }, [filtered]);

  // Stats
  const stats = useMemo(() => {
    const total = filtered.length;
    const happened = filtered.filter(v => v.outreach_happened?.toLowerCase() === "yes").length;
    const totalParents = filtered.reduce((s, v) => s + (Number(v.parents_trained) || 0), 0);
    const totalBooks = filtered.reduce((s, v) => s + (Number(v.children_books) || 0), 0);
    const totalKm = filtered.reduce((s, v) => s + (Number(v.transport_km) || 0), 0);
    const totalCost = filtered.reduce((s, v) => s + (Number(v.transport_cost) || 0), 0);
    return { total, happened, totalParents, totalBooks, totalKm, totalCost };
  }, [filtered]);

  const toggleType = (t) => setActiveTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  const toggleHappened = (h) => setActiveHappened(prev => prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h]);

  const anyFilters = activeTypes.length > 0 || activeHappened.length > 0 || dateRange !== "all";

  // ── Row ──
  const renderRow = (v) => {
    const prac = practitioners[v.practitioner_id];
    const hap = resolveHappened(v.outreach_happened);
    const isUpdate = v.outreach_type?.toLowerCase().trim() === "update";
    return (
      <div
        key={v.id}
        className={`ov-row${selected?.id === v.id ? " selected" : ""}`}
        onClick={() => setSelected(prev => prev?.id === v.id ? null : v)}
      >
        <div className="ov-row-date">{fmtDate(v.date)}</div>

        <div>
          <div className="ov-row-practitioner">{prac?.name || "Unknown"}</div>
          <div className="ov-row-prac-ecdc">{prac?.ecdc?.name || "No ECDC"}</div>
        </div>

        <div>
          <span className={`ov-row-type${isUpdate ? " update" : ""}`}>
            {v.outreach_type || "—"}
          </span>
        </div>

        <div>
          <span className="ov-row-badge" style={{ background: hap.bg, color: hap.text }}>
            {hap.label}
          </span>
        </div>

        <div className="ov-row-metric">
          {v.parents_trained != null
            ? <><span className="ov-row-metric-val">{v.parents_trained}</span> parents</>
            : <span className="ov-row-dash">—</span>}
        </div>

        <div className="ov-row-metric">
          {v.children_books != null
            ? <><span className="ov-row-metric-val">{v.children_books}</span> books</>
            : <span className="ov-row-dash">—</span>}
        </div>

        <div className="ov-row-metric">
          {v.transport_km != null
            ? <><span className="ov-row-metric-val">{v.transport_km}</span> km</>
            : <span className="ov-row-dash">—</span>}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
          {v.photos_taken && (
            <span className="ov-row-camera" title="Photos taken"><CameraIcon /></span>
          )}
          {v.comments && (
            <span className="ov-row-comment">"{v.comments}"</span>
          )}
        </div>
      </div>
    );
  };

  // ── Detail ──
  const renderDetail = () => {
    if (!selected) return (
      <div className="ov-detail-empty">
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          <line x1="8" y1="14" x2="8.01" y2="14"/><line x1="12" y1="14" x2="12.01" y2="14"/><line x1="16" y1="14" x2="16.01" y2="14"/>
        </svg>
        <div>Select a visit to view details</div>
      </div>
    );

    const v = selected;
    const prac = practitioners[v.practitioner_id];
    const hap = resolveHappened(v.outreach_happened);

    const metric = (label, val, unit = "") => ({
      label, val: val != null ? `${val}${unit}` : null
    });

    const metrics = [
      metric("Parents trained", v.parents_trained),
      metric("Parents enrolled", v.parents_enrolled),
      metric("Books to children", v.children_books),
      metric("Books per child", v.books_per_child),
      metric("Books to prac.", v.books_to_practitioner),
      metric("Transport km", v.transport_km, " km"),
      metric("Transport cost", v.transport_cost != null ? `R${Number(v.transport_cost).toFixed(0)}` : null),
      metric("Transport type", v.transport_type),
    ];

    return (
      <>
        <div className="ov-detail-hero">
          <div className="ov-detail-hero-head">
            <div>
              <div className="ov-detail-date">{fmtDate(v.date)}</div>
              <span className="ov-detail-type-badge">{v.outreach_type || "Visit"}</span>
            </div>
            <button className="ov-detail-close" onClick={() => setSelected(null)}>✕</button>
          </div>

          <div className="ov-detail-prac-name">{prac?.name || "Unknown practitioner"}</div>
          <div className="ov-detail-ecdc">{prac?.ecdc?.name || "No ECDC"}{prac?.ecdc?.area ? ` · ${prac.ecdc.area}` : ""}</div>

          <div className="ov-detail-happened" style={{ background: hap.bg, color: hap.text }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              {v.outreach_happened?.toLowerCase() === "yes"
                ? <polyline points="20 6 9 17 4 12"/>
                : <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}
            </svg>
            {hap.label}
          </div>
          {v.did_instead && (
            <div className="ov-did-instead">Instead: {v.did_instead}</div>
          )}
        </div>

        {/* Metrics */}
        <div className="ov-detail-section">
          <div className="ov-detail-section-title">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            Metrics
          </div>
          <div className="ov-metric-grid">
            {metrics.map(({ label, val }) => (
              <div key={label} className="ov-metric-card">
                <div className="ov-metric-card-label">{label}</div>
                <div className={`ov-metric-card-value${val == null ? " empty" : ""}`}>
                  {val ?? "—"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Logistics */}
        <div className="ov-detail-section">
          <div className="ov-detail-section-title">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
            Logistics
          </div>
          {[
            { label: <><CameraIcon /> Photos taken</>, value: v.photos_taken ? "Yes" : "No" },
            { label: <><PersonIcon /> Data capturer</>, value: v.data_capturer?.name || "—" },
            { label: "Created", value: v.created_at ? new Date(v.created_at).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" }) : "—" },
          ].map(({ label, value }, i) => (
            <div key={i} className="ov-meta-row">
              <div className="ov-meta-row-label">{label}</div>
              <div className="ov-meta-row-value">{value}</div>
            </div>
          ))}
        </div>

        {/* Comments */}
        {v.comments && (
          <div className="ov-detail-section">
            <div className="ov-detail-section-title">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Comments
            </div>
            <div className="ov-comment-box">"{v.comments}"</div>
          </div>
        )}
      </>
    );
  };

  return (
    <>
      <style>{styles}</style>
      <div className="ov-page">

        {/* Sidebar */}
        <div className={`ov-sidebar${sidebarCollapsed ? " collapsed" : ""}`}>
          <div className="ov-sidebar-top">
            <img className="ov-sidebar-logo" src={logo} alt="Layita" />
            <button className="ov-collapse-btn" onClick={() => setSidebarCollapsed(v => !v)}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                {sidebarCollapsed ? <polyline points="9 18 15 12 9 6"/> : <polyline points="15 18 9 12 15 6"/>}
              </svg>
            </button>
          </div>
          <nav className="ov-sidebar-nav">
            <ul>
              {NAV_ITEMS.map(({ to, label, icon }) => (
                <li key={to}>
                  <NavLink to={to} data-tooltip={label}>
                    {icon}
                    <span className="ov-nav-label">{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Main */}
        <div className="ov-main">

          {/* Topbar */}
          <div className="ov-topbar">
            <div className="ov-topbar-title">Outreach Visits</div>
            <div className="ov-topbar-controls">
              <div className="ov-search-wrap">
                <svg className="ov-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  className="ov-search-input"
                  placeholder="Search practitioner, ECDC, type…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <select className="ov-select" value={dateRange} onChange={e => setDateRange(e.target.value)}>
                <option value="all">All time</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <button
                className="ov-select"
                style={{ display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}
                onClick={() => setSortDir(d => d === "desc" ? "asc" : "desc")}
              >
                {sortDir === "desc" ? "Newest first" : "Oldest first"}
                <ChevronIcon dir={sortDir === "desc" ? "down" : "up"} />
              </button>
            </div>
          </div>

          {/* Filter bar */}
          <div className="ov-filterbar">
            <span className="ov-filter-label">Type</span>
            {allTypes.map(type => (
              <div key={type} className={`ov-chip${activeTypes.includes(type) ? " active" : ""}`} onClick={() => toggleType(type)}>
                {type}
              </div>
            ))}
            <div className="ov-divider" />
            <span className="ov-filter-label">Status</span>
            {[
              { key: "yes", label: "Happened" },
              { key: "no",  label: "Did not happen" },
            ].map(({ key, label }) => (
              <div key={key} className={`ov-chip${activeHappened.includes(key) ? " active" : ""}`} onClick={() => toggleHappened(key)}>
                {label}
              </div>
            ))}
            {anyFilters && (
              <button className="ov-filter-clear" onClick={() => { setActiveTypes([]); setActiveHappened([]); setDateRange("all"); }}>
                Clear all
              </button>
            )}
          </div>

          {/* Stats strip */}
          <div className="ov-stats">
            <div className="ov-stat">
              <div className="ov-stat-value">{stats.total}</div>
              <div className="ov-stat-label">Visits shown</div>
            </div>
            <div className="ov-stat">
              <div className="ov-stat-value" style={{ color: t.success }}>{stats.happened}</div>
              <div className="ov-stat-label">Completed</div>
            </div>
            <div className="ov-stat">
              <div className="ov-stat-value">{stats.totalParents}</div>
              <div className="ov-stat-label">Parents trained</div>
            </div>
            <div className="ov-stat">
              <div className="ov-stat-value">{stats.totalBooks}</div>
              <div className="ov-stat-label">Books distributed</div>
            </div>
            <div className="ov-stat">
              <div className="ov-stat-value">{Math.round(stats.totalKm)} km</div>
              <div className="ov-stat-label">Total distance</div>
            </div>
            <div className="ov-stat">
              <div className="ov-stat-value">R{Math.round(stats.totalCost).toLocaleString()}</div>
              <div className="ov-stat-label">Transport cost</div>
            </div>
          </div>

          {/* Body */}
          <div className="ov-body">
            <div className={`ov-list-panel${!selected ? " expanded" : ""}`}>
              {loading ? (
                <div className="ov-loading">
                  <div className="ov-spinner" /> Loading visits…
                </div>
              ) : (
                <div className="ov-list-scroll">
                  {filtered.length === 0 ? (
                    <div className="ov-no-results">No visits match your filters.</div>
                  ) : (
                    <>
                      <div className="ov-list-header">
                        <div>Date</div>
                        <div>Practitioner</div>
                        <div>Type</div>
                        <div>Status</div>
                        <div>Parents</div>
                        <div>Books</div>
                        <div>Distance</div>
                        <div>Notes</div>
                      </div>
                      {grouped.map(({ month, visits: gv }) => (
                        <div key={month}>
                          <div className="ov-month-header">
                            {month}
                            <span className="ov-month-header-count">{gv.length}</span>
                          </div>
                          {gv.map(renderRow)}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Detail panel */}
            {selected && (
              <div className="ov-detail-panel">
                {renderDetail()}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}