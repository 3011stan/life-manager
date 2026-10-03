import type { ScoreSummary as ScoreSummaryType } from "@/types/life-manager";

type ScoreSummaryProps = {
  summary: ScoreSummaryType;
};

export function ScoreSummary({ summary }: ScoreSummaryProps) {
  return (
    <section className="score-grid" aria-label="Daily score summary">
      <ScoreCard label="Execution" value={`${summary.executionScore}%`} />
      <ScoreCard label="Alignment" value={`${summary.alignmentScore}%`} />
      <ScoreCard label="Planned" value={`${summary.plannedMinutes}m`} />
      <ScoreCard label="Actual" value={`${summary.actualMinutes}m`} />
      <ScoreCard label="Useful" value={`${summary.usefulMinutes}m`} />
      <ScoreCard label="Support" value={`${summary.nonUsefulMinutes}m`} />
      <ScoreCard label="Deep work" value={`${summary.deepWorkMinutes}m`} />
    </section>
  );
}

function ScoreCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="score-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
