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
import { memo, useRef, useState, type PointerEvent } from "react";
import { Check, Close, Dash, Grip, Target } from "@/components/icons";
import { formatMinutes } from "@/lib/day/dates";
import { childrenOf, groupMinutes, siblingsOf, topLevel } from "@/lib/day/groups";
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
  onDelete: (entry: Entry) => void;
}

const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

// 004 D2: the row shows what was typed; the activity only when it says more.
export function activityLabel(entry: Entry, activities: Map<string, Activity>): string | null {
  const name = entry.activityId ? activities.get(entry.activityId)?.name : undefined;
  return name && fold(name) !== fold(entry.title) ? name : null;
}

// Research R10: pointer, touch, and keyboard reordering with a 44 px handle.
// Entries move among their siblings: the top level, or their group (004 D1).
export function Timeline({ entries, activities, disabled, onOpen, onMove, onToggle, onDelete }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const moved = entries.find((e) => e.id === active.id);
    const target = entries.find((e) => e.id === over.id);
    if (!moved || !target || moved.groupId !== target.groupId) return;
    const siblings = siblingsOf(entries, moved);
    onMove(moved.id, keyForMove(siblings, moved.id, siblings.findIndex((e) => e.id === target.id)));
  }

  const rowProps = { activities, disabled, onOpen, onToggle, onDelete };
  const top = topLevel(entries);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={top.map((e) => e.id)} strategy={verticalListSortingStrategy}>
        <ol className="timeline">
          {top.map((entry) =>
            entry.kind === "heading" ? (
              <Heading key={entry.id} entry={entry} minutes={groupMinutes(entries, entry.id)} disabled={disabled} onOpen={onOpen}>
                <SortableContext items={childrenOf(entries, entry.id).map((e) => e.id)} strategy={verticalListSortingStrategy}>
                  <ol className="timeline group">
                    {childrenOf(entries, entry.id).map((child) => (
                      <Row key={child.id} entry={child} {...rowProps} />
                    ))}
                  </ol>
                </SortableContext>
              </Heading>
            ) : (
              <Row key={entry.id} entry={entry} {...rowProps} />
            ),
          )}
        </ol>
      </SortableContext>
    </DndContext>
  );
}

function Heading({
  entry,
  minutes,
  disabled,
  onOpen,
  children,
}: {
  entry: Entry;
  minutes: number;
  disabled: boolean;
  onOpen: (id: string) => void;
  children: React.ReactNode;
}) {
  const t = useT();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: entry.id, disabled });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`group-block ${isDragging ? "entry-row--dragging" : ""}`} data-testid="group">
      <div className="group-heading">
        <button type="button" className="drag-handle" aria-label={t("day.dragHandle", { title: entry.title })} disabled={disabled} {...attributes} {...listeners}>
          <Grip />
        </button>
        <button type="button" className="entry-row__main group-heading__main" onClick={() => onOpen(entry.id)}>
          <span className="entry-row__title">{entry.title}</span>
          <span className="entry-row__time">{formatMinutes(minutes)}</span>
        </button>
      </div>
      {children}
    </li>
  );
}

const SWIPE_REVEAL = 80;

const Row = memo(function Row({
  entry,
  activities,
  disabled,
  onOpen,
  onToggle,
  onDelete,
}: {
  entry: Entry;
  activities: Map<string, Activity>;
  disabled: boolean;
  onOpen: (id: string) => void;
  onToggle: (entry: Entry) => void;
  onDelete: (entry: Entry) => void;
}) {
  const t = useT();
  const [offset, setOffset] = useState(0);
  const start = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: entry.id, disabled });
  const useful = entry.segments.filter((s) => s.timeValue === "useful").reduce((n, s) => n + s.minutes, 0);
  const support = entry.segments.filter((s) => s.timeValue === "support").reduce((n, s) => n + s.minutes, 0);
  const minutes = entry.status === "completed" && entry.actualMinutes !== null ? entry.actualMinutes : entry.plannedMinutes;
  const done = entry.status === "completed";
  const noActivity = !entry.activityId && !entry.isTimeBlock;
  const label = activityLabel(entry, activities);
  const revealed = offset <= -SWIPE_REVEAL;

  // 004 D4: swipe left on touch reveals Delete.
  function down(e: PointerEvent) {
    if (e.pointerType !== "touch" || disabled) return;
    start.current = { x: e.clientX, y: e.clientY };
    swiped.current = false;
  }
  function move(e: PointerEvent) {
    if (!start.current) return;
    const dx = e.clientX - start.current.x;
    const dy = e.clientY - start.current.y;
    if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) swiped.current = true;
    if (swiped.current) setOffset(Math.min(0, Math.max(-SWIPE_REVEAL * 1.5, dx + (revealed ? -SWIPE_REVEAL : 0))));
  }
  function up() {
    if (!start.current) return;
    start.current = null;
    setOffset((o) => (o <= -SWIPE_REVEAL / 2 ? -SWIPE_REVEAL : 0));
  }

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`entry-row entry-row--${entry.status} ${entry.isTimeBlock ? "entry-row--block" : ""} ${isDragging ? "entry-row--dragging" : ""}`}
      data-testid="entry-row"
    >
      <div className="entry-row__swipe" style={{ transform: offset ? `translateX(${String(offset)}px)` : undefined }} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        <button type="button" className="drag-handle" aria-label={t("day.dragHandle", { title: entry.title })} disabled={disabled} {...attributes} {...listeners}>
          <Grip />
        </button>
        <button
          type="button"
          className={`status-button ${done ? "status-button--done" : entry.status !== "planned" ? "status-button--off" : ""}`}
          aria-label={done || entry.status !== "planned" ? t("day.markPlanned", { title: entry.title }) : t("day.markDone", { title: entry.title })}
          aria-pressed={done}
          disabled={disabled}
          onClick={() => onToggle(entry)}
        >
          {done ? <Check size={14} /> : entry.status === "skipped" ? <Dash size={14} /> : entry.status === "cancelled" ? <Close size={12} /> : null}
        </button>
        <button
          type="button"
          className="entry-row__main"
          onClick={() => {
            if (swiped.current) return;
            if (revealed) return setOffset(0);
            onOpen(entry.id);
          }}
        >
          <span className="entry-row__title">
            {entry.title}
            {label ? <span className="entry-row__activity"> · {label}</span> : null}
          </span>
          <span className="entry-row__time">{entry.startTime ?? formatMinutes(minutes)}</span>
          {entry.contributesTo.length > 0 ? (
            <span className="mark mark--objective" aria-label={t("objective.mark")} title={t("objective.mark")}>
              <Target size={14} />
            </span>
          ) : null}
          {noActivity ? <span className="mark mark--warn">{t("day.noActivity")}</span> : null}
        </button>
        <button type="button" className="row-delete" aria-label={t("day.deleteRow", { title: entry.title })} disabled={disabled} onClick={() => onDelete(entry)}>
          {t("common.delete")}
        </button>
      </div>
      {entry.segments.length > 0 ? (
        <div className="entry-row__parts">
          <ol className="segments" aria-label={`${t("day.useful", { n: formatMinutes(useful) })}, ${t("day.support", { n: formatMinutes(support) })}`}>
            {entry.segments.map((s) => (
              <li key={s.id} className={`segment segment--${s.timeValue}`}>
                <span>{s.title}</span>
                <span>{formatMinutes(s.minutes)}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </li>
  );
});
