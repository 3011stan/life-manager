type UsefulTimeBarProps = {
  usefulMinutes: number;
  nonUsefulMinutes: number;
};

export function UsefulTimeBar({ usefulMinutes, nonUsefulMinutes }: UsefulTimeBarProps) {
  const total = usefulMinutes + nonUsefulMinutes;
  const usefulPercent = total > 0 ? Math.round((usefulMinutes / total) * 100) : 0;

  return (
    <div className="useful-time" aria-label={`${usefulMinutes} useful minutes and ${nonUsefulMinutes} non-useful minutes`}>
      <div className="useful-time__track">
        <span className="useful-time__useful" style={{ width: `${usefulPercent}%` }} />
      </div>
      <div className="useful-time__legend">
        <span>{usefulMinutes}m useful</span>
        <span>{nonUsefulMinutes}m support</span>
      </div>
    </div>
  );
}
