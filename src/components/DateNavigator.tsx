import { formatDisplayDate } from "@/lib/dates";

type DateNavigatorProps = {
  date: string;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
};

export function DateNavigator({ date, onPrevious, onNext, onToday }: DateNavigatorProps) {
  return (
    <div className="date-nav">
      <button type="button" className="icon-button" onClick={onPrevious} aria-label="Previous day">
        ←
      </button>
      <div>
        <p className="eyebrow">Daily cycle</p>
        <h1>{formatDisplayDate(date)}</h1>
        <p className="date-nav__iso">{date}</p>
      </div>
      <div className="date-nav__actions">
        <button type="button" className="ghost-button" onClick={onToday}>
          Today
        </button>
        <button type="button" className="icon-button" onClick={onNext} aria-label="Next day">
          →
        </button>
      </div>
    </div>
  );
}
