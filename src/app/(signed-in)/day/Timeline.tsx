"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { formatMinutes } from "@/lib/day/dates";
import { keyForMove } from "@/lib/day/order";
import type { Activity, Entry } from "@/lib/day/types";
import { useT } from "@/lib/i18n";

interface Props {
  entries: Entry[];
  activities: Map<string, Activity>;
  disabled: boolean;
  onOpen: (id: string) => void;
  onMove: (id: string, orderKey: string) => void;
  onToggle: (entry: Entry) => void;
}

export function displayName(entry: Entry, activities: Map<string, Activity>): string {
  return entry.activityId ? (activities.get(entry.activityId)?.name ?? entry.title) : entry.title;
}

// Research R10: pointer, touch, and keyboard reordering with a 44 px handle.
export function Timeline({ entries, activities, disabled, onOpen, onMove, onToggle }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const to = entries.findIndex((e) => e.id === over.id);
    onMove(String(active.id), keyForMove(entries, String(active.id), to));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={entries.map((e) => e.id)} strategy={verticalListSortingStrategy}>
        <ol className="timeline">
          {entries.map((entry) => (
            <Row key={entry.id} entry={entry} name={displayName(entry, activities)} disabled={disabled} onOpen={onOpen} onToggle={onToggle} />
          ))}
        </ol>
      </SortableContext>
    </DndContext>
  );
}

function Row({
  entry,
  name,
  disabled,
  onOpen,
  onToggle,
}: {
  entry: Entry;
  name: string;
  disabled: boolean;
  onOpen: (id: string) => void;
  onToggle: (entry: Entry) => void;
}) {
  const t = useT();
  const [expanded, setExpanded] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: entry.id, disabled });
  const useful = entry.segments.filter((s) => s.timeValue === "useful").reduce((n, s) => n + s.minutes, 0);
  const support = entry.segments.filter((s) => s.timeValue === "support").reduce((n, s) => n + s.minutes, 0);
  const minutes = entry.status === "completed" && entry.actualMinutes !== null ? entry.actualMinutes : entry.plannedMinutes;
  const done = entry.status === "completed";
  const noActivity = !entry.activityId && !entry.isTimeBlock;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`entry-row entry-row--${entry.status} ${entry.isTimeBlock ? "entry-row--block" : ""} ${isDragging ? "entry-row--dragging" : ""}`}
      data-testid="entry-row"
    >
      <button type="button" className="drag-handle" aria-label={t("day.dragHandle", { title: name })} disabled={disabled} {...attributes} {...listeners}>
        ⋮⋮
      </button>
      <button
        type="button"
        className={`status-button ${done ? "status-button--done" : ""}`}
        aria-label={done || entry.status !== "planned" ? t("day.markPlanned", { title: name }) : t("day.markDone", { title: name })}
        aria-pressed={done}
        disabled={disabled}
        onClick={() => onToggle(entry)}
      >
        {done ? "✓" : entry.status === "skipped" ? "–" : entry.status === "cancelled" ? "×" : ""}
      </button>
      <button type="button" className="entry-row__main" onClick={() => onOpen(entry.id)}>
        <span className="entry-row__title">{name}</span>
        <span className="entry-row__time">{entry.startTime ?? formatMinutes(minutes)}</span>
        {noActivity ? <span className="mark mark--warn">{t("day.noActivity")}</span> : null}
      </button>
      {entry.segments.length > 0 ? (
        <>
          <button
            type="button"
            className="icon-button"
            aria-expanded={expanded}
            aria-label={expanded ? t("day.collapse") : t("day.expand")}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "▾" : "▸"}
          </button>
          <div className="time-split" aria-label={`${t("day.useful", { n: formatMinutes(useful) })}, ${t("day.support", { n: formatMinutes(support) })}`}>
            <span className="time-split__useful" style={{ flexGrow: useful }} />
            <span className="time-split__support" style={{ flexGrow: support }} />
          </div>
          {expanded ? (
            <ol className="segments">
              {entry.segments.map((s) => (
                <li key={s.id} className={`segment segment--${s.timeValue}`}>
                  <span>{s.title}</span>
                  <span>{formatMinutes(s.minutes)}</span>
                </li>
              ))}
            </ol>
          ) : null}
        </>
      ) : null}
    </li>
  );
}
