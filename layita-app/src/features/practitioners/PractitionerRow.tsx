// src/features/practitioners/PractitionerRow.tsx

import { resolveGroupColor, resolveGroupNameShortForm } from "../../lib/Groupcolors";
import { Practitioner } from "./types";
import {
  daysSince,
  VisitBadge,
  TrainingDots,
  WhatsAppIcon,
} from "./_components";

interface Props {
  p: Practitioner;
  selected: Practitioner | null;
  lastVisit: string | undefined;
  onClick: () => void;
}

export default function PractitionerRow({ p, selected, lastVisit, onClick }: Props) {
  const color      = resolveGroupColor(p.group?.group_name);
  const group      = p.group?.group_name;
  const days       = daysSince(lastVisit);
  const isSelected = selected?.id === p.id;
  const anySelected = !!selected;

  return (
    <div
      className={`p2-row ${isSelected ? "p2-row--selected" : ""}`}
      onClick={onClick}
      style={{ "--group-color": color.fill } as React.CSSProperties}
    >
      <div className="p2-row__indicator" />

      <div className="p2-row__name-col">
        <span className="p2-row__name">{p.name || "—"}</span>
        {group && (
          <span className="p2-row__group" style={{ color: color.fill }}>
            {anySelected ? resolveGroupNameShortForm(group) : group}
          </span>
        )}
      </div>

      <div className="p2-row__ecdc">
        <span className="p2-row__ecdc-name">{p.ecdc?.name || <em>No ECDC</em>}</span>
        {p.ecdc?.area && <span className="p2-row__ecdc-area">{p.ecdc.area}</span>}
      </div>

      <div className="p2-row__visit">
        <VisitBadge days={days} />
      </div>

      <div className="p2-row__training">
        <TrainingDots practitioner={p} />
      </div>

      <div className="p2-row__flags">
        {p.has_whatsapp && (
          <span className="p2-row__whatsapp" title="Has WhatsApp">
            <WhatsAppIcon size={13} />
          </span>
        )}
        {p.dsd_funded && (
          <span className="p2-row__tag" title="DSD Funded">DSD</span>
        )}
      </div>
    </div>
  );
}