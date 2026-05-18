import { AlertTriangle, ChevronDown, ChevronUp, Edit2, KeyRound, Settings } from "lucide-react";
import type { KeyResult, ObjectiveCard } from "../../services/strategicApi";
import { COLORS } from "./okrsShared";

interface ObjectiveCardViewProps {
  canEdit: boolean;
  card: ObjectiveCard;
  expanded: boolean;
  onEdit: () => void;
  onManageKrs: () => void;
  onToggle: () => void;
}

export function ObjectiveCardView({ card, expanded, canEdit, onToggle, onManageKrs, onEdit }: ObjectiveCardViewProps) {
  const completionColor = card.lowCompletionAlert ? COLORS.orange : card.completionPercentage >= 70 ? COLORS.green : COLORS.blue;
  return (
    <div className="bg-white rounded-lg overflow-hidden" style={{ border: `1.5px solid ${card.lowCompletionAlert ? "#FDBA74" : "#E5E7EB"}` }}>
      <div className="flex items-start gap-4 p-4 cursor-pointer hover:bg-gray-50" onClick={onToggle}>
        <div className="relative flex-shrink-0" style={{ width: 52, height: 52 }}>
          <svg width="52" height="52" viewBox="0 0 52 52">
            <circle cx="26" cy="26" r="20" fill="none" stroke="#F3F4F6" strokeWidth="5" />
            <circle cx="26" cy="26" r="20" fill="none" stroke={completionColor} strokeWidth="5" strokeDasharray={`${(card.completionPercentage / 100) * 125.66} 125.66`} strokeLinecap="round" transform="rotate(-90 26 26)" />
          </svg>
          <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontSize: "10px", fontWeight: 800, color: completionColor }}>{card.completionPercentage}%</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {card.lowCompletionAlert && <span className="flex items-center gap-1 px-2 py-0.5 rounded" style={{ backgroundColor: "#FEF3F2", color: "#991B1B", fontSize: "10px", fontWeight: 800 }}><AlertTriangle size={10} /> Baja cobertura</span>}
            <span style={{ backgroundColor: "#EEF2FF", color: COLORS.blue, fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>{card.academicPeriodName}</span>
            <span style={{ backgroundColor: "#F9FAFB", color: "#374151", fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>{card.departmentName}</span>
          </div>
          <h3 style={{ fontSize: "14px", fontWeight: 800, color: "#000", lineHeight: 1.4 }}>{card.name}</h3>
          <p style={{ fontSize: "12px", color: COLORS.gray, marginTop: 4, lineHeight: 1.5 }}>{card.description}</p>
          <p style={{ fontSize: "11px", color: "#374151", marginTop: 8 }}>
            <strong>Apuesta:</strong> {card.strategicBetName} - <strong>Meta:</strong> {card.goalName}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0" onClick={(event) => event.stopPropagation()}>
          {canEdit && (
            <>
              <button onClick={onEdit} className="flex items-center gap-1 px-2 py-1.5 rounded hover:bg-gray-100" style={{ border: "1px solid #E5E7EB", fontSize: "11px", color: "#374151", fontWeight: 700 }}>
                <Edit2 size={12} /> Editar
              </button>
              <button onClick={onManageKrs} className="flex items-center gap-1 px-2 py-1.5 rounded hover:bg-gray-100" style={{ border: "1px solid #E5E7EB", fontSize: "11px", color: COLORS.blue, fontWeight: 700 }}>
                <Settings size={12} /> KRs
              </button>
            </>
          )}
          {expanded ? <ChevronUp size={16} color="#9CA3AF" /> : <ChevronDown size={16} color="#9CA3AF" />}
        </div>
      </div>
      {expanded && (
        <div className="p-4 space-y-2" style={{ borderTop: "1px solid #F3F4F6", backgroundColor: "#FAFAFA" }}>
          {card.keyResults.length === 0 ? (
            <p style={{ fontSize: "12px", color: "#9CA3AF" }}>Sin Key Results definidos.</p>
          ) : card.keyResults.map((kr) => (
            <KrRow key={kr.id} kr={kr} />
          ))}
        </div>
      )}
    </div>
  );
}

function KrRow({ kr }: { kr: KeyResult }) {
  const color = kr.progressPercentage >= 70 ? COLORS.green : kr.progressPercentage < 30 ? COLORS.orange : COLORS.blue;
  return (
    <div className="rounded-lg bg-white p-3" style={{ border: "1px solid #E5E7EB" }}>
      <div className="flex items-start gap-3">
        <KeyRound size={14} color={color} className="mt-0.5" />
        <div className="flex-1">
          <p style={{ fontSize: "12px", fontWeight: 800, color: "#000" }}>{kr.name}</p>
          <p style={{ fontSize: "11px", color: COLORS.gray, marginTop: 2 }}>{kr.description}</p>
          <p style={{ fontSize: "10px", color: "#9CA3AF", marginTop: 4 }}>
            {kr.metric} - Base {kr.baseValue} - Actual {kr.currentValue} - Objetivo {kr.targetValue} {kr.measurementUnitName}
          </p>
        </div>
        <span style={{ fontSize: "13px", fontWeight: 900, color }}>{kr.progressPercentage}%</span>
      </div>
    </div>
  );
}
