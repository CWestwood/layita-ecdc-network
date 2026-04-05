// src/features/visits/VisitDetail.tsx

import { VisitRow } from './api/useVisits';
import { themeColors as t } from '../../lib/layita_colors';
import { fmtDate, resolveHappened, PencilIcon, PersonIcon, CloseIcon } from './_components';
import VisitEditForm from './VisitEditForm';
import { useState } from 'react';
import { supabase } from '../auth/supabaseClient';


interface Props {
  visit: VisitRow;
  onClose: () => void;
}




export default function VisitDetail({ visit: v, onClose }: Props) {
  const hap = resolveHappened(v.outreach_happened);

  const [editing, setEditing] = useState(false);

  const handleEditClick = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('Permission denied — only administrators can access the edit form.');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'Administrator') {
      alert('Permission denied — only administrators can access the edit form.');
      return;
    }

    setEditing(true);
  };

  if (editing) {
    return <VisitEditForm key={v.id} visit={v} onDone={() => setEditing(false)} onSaved={() => setEditing(false)} />;
  }

  const metrics = [
    { label: 'Parents trained',   val: v.parents_trained        },
    { label: 'Parents enrolled',  val: v.parents_enrolled       },
    { label: 'Books to children', val: v.children_books         },
    { label: 'Books per child',   val: v.books_per_child        },
    { label: 'Books to prac.',    val: v.books_to_practitioner  },
    { label: 'Transport km',      val: v.transport_km   != null ? `${v.transport_km} km`                           : null },
    { label: 'Transport cost',    val: v.transport_cost != null ? `R${Number(v.transport_cost).toFixed(0)}`        : null },
    { label: 'Transport type',    val: v.transport_type                                                             },
  ];

  return (
    <>
      {/* ── Hero ── */}
      <div className="ov-detail-hero">
        <div className="ov-detail-hero__head">
          <div>
            <div className="ov-detail-date">{fmtDate(v.date)}</div>
            <span className="ov-detail-type-badge">{v.outreach_type || 'Visit'}</span>
          </div>

          <div className="ov-detail-hero__actions">
          <button className="ov-detail-action-btn" onClick={handleEditClick}>
            <PencilIcon />
          </button>
          <button className="ov-detail-action-btn" onClick={onClose}>
            <CloseIcon />
          </button>
          </div>
        </div>

        <div className="ov-detail-prac-name">{v.practitioner?.name || 'Unknown practitioner'}</div>

        <div
          className="ov-detail-happened"
          style={{ background: hap.bg, color: hap.text }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5">
            {v.outreach_happened?.toLowerCase() === 'yes'
              ? <polyline points="20 6 9 17 4 12" />
              : <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>}
          </svg>
          {hap.label}
        </div>

        {v.did_instead && (
          <div className="ov-did-instead">Instead: {v.did_instead}</div>
        )}
      </div>

      {/* ── Metrics ── */}
      <div className="ov-detail-section">
        <div className="ov-detail-section__title">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4"  />
            <line x1="6"  y1="20" x2="6"  y2="14" />
          </svg>
          Metrics
        </div>
        <div className="ov-metric-grid">
          {metrics.map(({ label, val }) => (
            <div key={label} className="ov-metric-card">
              <div className="ov-metric-card__label">{label}</div>
              <div className={`ov-metric-card__value${val == null ? ' ov-metric-card__value--empty' : ''}`}>
                {val ?? '—'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Logistics ── */}
      <div className="ov-detail-section">
        <div className="ov-detail-section__title">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          Logistics
        </div>
        {([
          { label: <><PersonIcon /> Data capturer</>, value: v.data_capturer?.name || '—' },
        ] as { label: React.ReactNode; value: string }[]).map(({ label, value }, i) => (
          <div key={i} className="ov-meta-row">
            <div className="ov-meta-row__label">{label}</div>
            <div className="ov-meta-row__value">{value}</div>
          </div>
        ))}
      </div>

      {/* ── Comments ── */}
      {v.comments && (
        <div className="ov-detail-section">
          <div className="ov-detail-section__title">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Comments
          </div>
          <div className="ov-comment-box">"{v.comments}"</div>
        </div>
      )}
    </>
  );
}