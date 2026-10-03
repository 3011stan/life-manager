import type { CarryDecision, CarryForwardCandidate, DailyCloseSummary, TimelineItem } from "@/types/life-manager";
import { ScoreSummary } from "./ScoreSummary";

type DailyClosePanelProps = {
  items: TimelineItem[];
  summary?: DailyCloseSummary;
  reviewNotes: string;
  onReviewNotesChange: (notes: string) => void;
  onGenerateClose: () => void;
  onCarryDecision: (candidateId: string, decision: CarryDecision) => void;
};

export function DailyClosePanel({
  items,
  summary,
  reviewNotes,
  onReviewNotesChange,
  onGenerateClose,
  onCarryDecision,
}: DailyClosePanelProps) {
  const unresolved = items.filter(
    (item) => item.status === "planned" || (item.status === "completed" && item.actualMinutes === undefined),
  );

  return (
    <section className="close-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Cycle close</p>
          <h2>Daily close</h2>
        </div>
        <button type="button" className="primary-button" onClick={onGenerateClose}>
          Generate close
        </button>
      </div>

      {unresolved.length > 0 ? (
        <div className="warning-box">
          <strong>{unresolved.length} items need review</strong>
          <p>Confirm status and actual minutes before finalizing the day.</p>
        </div>
      ) : null}

      <label className="notes-field">
        Review notes
        <textarea value={reviewNotes} onChange={(event) => onReviewNotesChange(event.target.value)} rows={4} />
      </label>

      {summary ? (
        <>
          <ScoreSummary summary={summary} />
          <div className="carry-list">
            <h3>Carry candidates</h3>
            {summary.carryCandidates.length === 0 ? <p>No skipped or partial items to carry.</p> : null}
            {summary.carryCandidates.map((candidate) => (
              <CarryCandidateRow
                key={candidate.id}
                candidate={candidate}
                onCarryDecision={onCarryDecision}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}

function CarryCandidateRow({
  candidate,
  onCarryDecision,
}: {
  candidate: CarryForwardCandidate;
  onCarryDecision: (candidateId: string, decision: CarryDecision) => void;
}) {
  return (
    <div className="carry-row">
      <span>{candidate.title}</span>
      <div>
        <button
          type="button"
          className={candidate.decision === "confirmed" ? "primary-button primary-button--subtle" : "ghost-button"}
          onClick={() => onCarryDecision(candidate.id, "confirmed")}
        >
          Carry
        </button>
        <button
          type="button"
          className={candidate.decision === "dismissed" ? "primary-button primary-button--subtle" : "ghost-button"}
          onClick={() => onCarryDecision(candidate.id, "dismissed")}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
