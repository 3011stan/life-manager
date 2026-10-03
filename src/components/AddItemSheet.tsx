"use client";

import { createDefaultBundleSegments } from "@/lib/timeline";
import type { BundleSegment, ItemKind, ItemStatus, TimeValue, TimelineItem } from "@/types/life-manager";
import { useMemo, useState } from "react";

type AddItemSheetProps = {
  editingItem?: TimelineItem;
  onCancel: () => void;
  onSave: (input: ItemFormValue) => void;
};

export type ItemFormValue = {
  kind: ItemKind;
  title: string;
  status: ItemStatus;
  plannedStart?: string;
  plannedMinutes: number;
  actualMinutes?: number;
  notes?: string;
  isAlignmentRelevant: boolean;
  isDeepWork: boolean;
  timeValue: TimeValue;
  segments: BundleSegment[];
};

const statuses: ItemStatus[] = ["planned", "completed", "partial", "skipped", "cancelled"];

export function AddItemSheet({ editingItem, onCancel, onSave }: AddItemSheetProps) {
  const initialSegments = useMemo(
    () => editingItem?.segments ?? createDefaultBundleSegments(),
    [editingItem],
  );
  const [kind, setKind] = useState<ItemKind>(editingItem?.kind ?? "simple");
  const [title, setTitle] = useState(editingItem?.title ?? "");
  const [status, setStatus] = useState<ItemStatus>(editingItem?.status ?? "planned");
  const [plannedStart, setPlannedStart] = useState(editingItem?.plannedStart ?? "");
  const [plannedMinutes, setPlannedMinutes] = useState(editingItem?.plannedMinutes ?? 30);
  const [actualMinutes, setActualMinutes] = useState<number | "">(editingItem?.actualMinutes ?? "");
  const [notes, setNotes] = useState(editingItem?.notes ?? "");
  const [isAlignmentRelevant, setAlignmentRelevant] = useState(editingItem?.isAlignmentRelevant ?? false);
  const [isDeepWork, setDeepWork] = useState(editingItem?.isDeepWork ?? false);
  const [timeValue, setTimeValue] = useState<TimeValue>(editingItem?.timeValue ?? "useful");
  const [segments, setSegments] = useState<BundleSegment[]>(initialSegments);

  function save() {
    onSave({
      kind,
      title,
      status,
      plannedStart: plannedStart || undefined,
      plannedMinutes,
      actualMinutes: actualMinutes === "" ? undefined : actualMinutes,
      notes,
      isAlignmentRelevant,
      isDeepWork,
      timeValue,
      segments,
    });
  }

  function updateSegment(segmentId: string, patch: Partial<BundleSegment>) {
    setSegments((current) =>
      current.map((segment) => (segment.id === segmentId ? { ...segment, ...patch } : segment)),
    );
  }

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label={editingItem ? "Edit item" : "Add item"}>
      <div className="sheet__header">
        <h2>{editingItem ? "Edit item" : "Add timeline item"}</h2>
        <button type="button" className="icon-button" onClick={onCancel} aria-label="Close">
          ×
        </button>
      </div>

      <div className="form-grid">
        <label>
          Type
          <select value={kind} onChange={(event) => setKind(event.target.value as ItemKind)}>
            <option value="simple">Simple item</option>
            <option value="bundle">Task bundle</option>
          </select>
        </label>

        <label>
          Title
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Deep work" />
        </label>

        <label>
          Start
          <input type="time" value={plannedStart} onChange={(event) => setPlannedStart(event.target.value)} />
        </label>

        <label>
          Planned minutes
          <input
            type="number"
            min="0"
            value={plannedMinutes}
            onChange={(event) => setPlannedMinutes(Number(event.target.value))}
            disabled={kind === "bundle"}
          />
        </label>

        <label>
          Actual minutes
          <input
            type="number"
            min="0"
            value={actualMinutes}
            onChange={(event) => setActualMinutes(event.target.value === "" ? "" : Number(event.target.value))}
          />
        </label>

        <label>
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value as ItemStatus)}>
            {statuses.map((itemStatus) => (
              <option key={itemStatus} value={itemStatus}>
                {itemStatus}
              </option>
            ))}
          </select>
        </label>

        {kind === "simple" ? (
          <label>
            Time value
            <select value={timeValue} onChange={(event) => setTimeValue(event.target.value as TimeValue)}>
              <option value="useful">Useful</option>
              <option value="non-useful">Support</option>
            </select>
          </label>
        ) : null}
      </div>

      {kind === "bundle" ? (
        <div className="segment-editor">
          <h3>Bundle segments</h3>
          {segments.map((segment) => (
            <div className="segment-editor__row" key={segment.id}>
              <input
                value={segment.title}
                onChange={(event) => updateSegment(segment.id, { title: event.target.value })}
                aria-label="Segment title"
              />
              <input
                type="number"
                min="1"
                value={segment.minutes}
                onChange={(event) => updateSegment(segment.id, { minutes: Number(event.target.value) })}
                aria-label="Segment minutes"
              />
              <select
                value={segment.timeValue}
                onChange={(event) => updateSegment(segment.id, { timeValue: event.target.value as TimeValue })}
                aria-label="Segment time value"
              >
                <option value="useful">Useful</option>
                <option value="non-useful">Support</option>
              </select>
            </div>
          ))}
        </div>
      ) : null}

      <label className="notes-field">
        Notes
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
      </label>

      <div className="check-row">
        <label>
          <input
            type="checkbox"
            checked={isAlignmentRelevant}
            onChange={(event) => setAlignmentRelevant(event.target.checked)}
          />
          Counts for alignment
        </label>
        <label>
          <input type="checkbox" checked={isDeepWork} onChange={(event) => setDeepWork(event.target.checked)} />
          Deep work
        </label>
      </div>

      <div className="sheet__actions">
        <button type="button" className="ghost-button" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="primary-button" onClick={save}>
          Save item
        </button>
      </div>
    </div>
  );
}
