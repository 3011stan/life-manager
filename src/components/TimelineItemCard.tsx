import { itemNonUsefulMinutes, itemUsefulMinutes } from "@/lib/timeline";
import type { ItemStatus, TimelineItem } from "@/types/life-manager";
import { UsefulTimeBar } from "./UsefulTimeBar";

type TimelineItemCardProps = {
  item: TimelineItem;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onEdit: (item: TimelineItem) => void;
  onStatusChange: (item: TimelineItem, status: ItemStatus) => void;
  onActualMinutesChange: (item: TimelineItem, actualMinutes: number | undefined) => void;
  onToggleBundle: (itemId: string) => void;
  onMove: (itemId: string, direction: -1 | 1) => void;
  onDragStart: (itemId: string) => void;
  onDragEnter: (itemId: string) => void;
  onDragEnd: () => void;
};

const statuses: ItemStatus[] = ["planned", "completed", "partial", "skipped", "cancelled"];

export function TimelineItemCard({
  item,
  index,
  isFirst,
  isLast,
  onEdit,
  onStatusChange,
  onActualMinutesChange,
  onToggleBundle,
  onMove,
  onDragStart,
  onDragEnter,
  onDragEnd,
}: TimelineItemCardProps) {
  const useful = itemUsefulMinutes(item);
  const nonUseful = itemNonUsefulMinutes(item);

  return (
    <article
      className={`timeline-card timeline-card--${item.status}`}
      draggable
      onDragStart={() => onDragStart(item.id)}
      onDragEnter={(event) => {
        event.preventDefault();
        onDragEnter(item.id);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragEnd={onDragEnd}
    >
      <div className="timeline-card__rail">
        <span className="timeline-card__dot" />
        <span className="timeline-card__line" />
      </div>

      <div className="timeline-card__content">
        <div className="timeline-card__top">
          <div>
            <p className="timeline-card__time">{item.plannedStart || "Unscheduled"}</p>
            <h2>{item.title}</h2>
          </div>
          <span className="timeline-card__kind">{item.kind === "bundle" ? "Bundle" : `#${index + 1}`}</span>
        </div>

        <div className="timeline-card__meta">
          <span>{item.plannedMinutes}m planned</span>
          <span>{item.actualMinutes ?? "?"}m actual</span>
          {item.isAlignmentRelevant ? <span>Alignment</span> : null}
          {item.isDeepWork ? <span>Deep work</span> : null}
        </div>

        {item.kind === "bundle" ? (
          <div className="bundle-block">
            <UsefulTimeBar usefulMinutes={useful} nonUsefulMinutes={nonUseful} />
            <button type="button" className="text-button" onClick={() => onToggleBundle(item.id)}>
              {item.isExpanded ? "Collapse bundle" : "Expand bundle"}
            </button>
            {item.isExpanded ? (
              <div className="bundle-segments">
                {item.segments.map((segment) => (
                  <div className="bundle-segment" key={segment.id}>
                    <span>{segment.title}</span>
                    <strong>{segment.minutes}m</strong>
                    <em>{segment.timeValue === "useful" ? "useful" : "support"}</em>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {item.notes ? <p className="timeline-card__notes">{item.notes}</p> : null}

        <div className="timeline-card__controls">
          <label>
            Status
            <select value={item.status} onChange={(event) => onStatusChange(item, event.target.value as ItemStatus)}>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label>
            Actual
            <input
              type="number"
              min="0"
              value={item.actualMinutes ?? ""}
              placeholder="min"
              onChange={(event) =>
                onActualMinutesChange(
                  item,
                  event.target.value === "" ? undefined : Number(event.target.value),
                )
              }
            />
          </label>
        </div>

        <div className="timeline-card__actions">
          <button type="button" className="ghost-button" onClick={() => onMove(item.id, -1)} disabled={isFirst}>
            Move up
          </button>
          <button type="button" className="ghost-button" onClick={() => onMove(item.id, 1)} disabled={isLast}>
            Move down
          </button>
          <button type="button" className="primary-button primary-button--subtle" onClick={() => onEdit(item)}>
            Edit
          </button>
        </div>
      </div>
    </article>
  );
}
