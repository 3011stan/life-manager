import type { ItemStatus, TimelineItem } from "@/types/life-manager";
import { TimelineItemCard } from "./TimelineItemCard";

type TimelineProps = {
  items: TimelineItem[];
  draggingId?: string;
  onEdit: (item: TimelineItem) => void;
  onStatusChange: (item: TimelineItem, status: ItemStatus) => void;
  onActualMinutesChange: (item: TimelineItem, actualMinutes: number | undefined) => void;
  onToggleBundle: (itemId: string) => void;
  onMove: (itemId: string, direction: -1 | 1) => void;
  onDragStart: (itemId: string) => void;
  onDragEnter: (itemId: string) => void;
  onDragEnd: () => void;
};

export function Timeline({
  items,
  onEdit,
  onStatusChange,
  onActualMinutesChange,
  onToggleBundle,
  onMove,
  onDragStart,
  onDragEnter,
  onDragEnd,
}: TimelineProps) {
  if (items.length === 0) {
    return (
      <div className="empty-state">
        <h2>No timeline items yet</h2>
        <p>Create the first block of the day or structure freeform capture.</p>
      </div>
    );
  }

  return (
    <section className="timeline" aria-label="Daily timeline">
      {items.map((item, index) => (
        <TimelineItemCard
          key={item.id}
          item={item}
          index={index}
          isFirst={index === 0}
          isLast={index === items.length - 1}
          onEdit={onEdit}
          onStatusChange={onStatusChange}
          onActualMinutesChange={onActualMinutesChange}
          onToggleBundle={onToggleBundle}
          onMove={onMove}
          onDragStart={onDragStart}
          onDragEnter={onDragEnter}
          onDragEnd={onDragEnd}
        />
      ))}
    </section>
  );
}
