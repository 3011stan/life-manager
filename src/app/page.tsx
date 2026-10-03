"use client";

import { AddItemSheet, type ItemFormValue } from "@/components/AddItemSheet";
import { DailyClosePanel } from "@/components/DailyClosePanel";
import { DateNavigator } from "@/components/DateNavigator";
import { FreeformCapture } from "@/components/FreeformCapture";
import { ScoreSummary } from "@/components/ScoreSummary";
import { Timeline } from "@/components/Timeline";
import { shiftISODate, todayISO } from "@/lib/dates";
import { createEmptyCycle, createSeedCycle } from "@/lib/demo-data";
import { parseFreeformText } from "@/lib/freeform";
import { calculateScores, createDailyCloseSummary } from "@/lib/scoring";
import { loadDailyCycle, saveDailyCycle } from "@/lib/storage";
import { createBundleItem, createSimpleItem, moveItem, reorderItems, toggleBundle, updateItem } from "@/lib/timeline";
import type { CarryDecision, DailyCycle, FreeformSuggestion, ItemStatus, TimelineItem } from "@/types/life-manager";
import { useEffect, useMemo, useState } from "react";

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [cycle, setCycle] = useState<DailyCycle | null>(null);
  const [isHydrated, setHydrated] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TimelineItem | undefined>();
  const [draggingId, setDraggingId] = useState<string>();
  const [reviewNotes, setReviewNotes] = useState("");

  useEffect(() => {
    window.setTimeout(() => {
      const loaded = loadDailyCycle(selectedDate);
      setCycle(loaded ?? createSeedCycle(selectedDate));
      setHydrated(true);
    }, 0);
  }, [selectedDate]);

  useEffect(() => {
    if (isHydrated && cycle) {
      saveDailyCycle(cycle);
    }
  }, [cycle, isHydrated]);

  const liveScores = useMemo(() => calculateScores(cycle?.items ?? []), [cycle?.items]);

  function updateCycle(updater: (current: DailyCycle) => DailyCycle) {
    setCycle((current) => {
      const base = current ?? createEmptyCycle(selectedDate);
      return updater(base);
    });
  }

  function saveItem(input: ItemFormValue) {
    updateCycle((current) => {
      const item =
        input.kind === "bundle"
          ? createBundleItem(input)
          : createSimpleItem({
              title: input.title,
              plannedStart: input.plannedStart,
              plannedMinutes: input.plannedMinutes,
              actualMinutes: input.actualMinutes,
              status: input.status,
              notes: input.notes,
              isAlignmentRelevant: input.isAlignmentRelevant,
              isDeepWork: input.isDeepWork,
              timeValue: input.timeValue,
            });

      if (editingItem) {
        return {
          ...current,
          items: updateItem(current.items, {
            ...item,
            id: editingItem.id,
            createdAt: editingItem.createdAt,
            isExpanded: editingItem.isExpanded,
          }),
        };
      }

      return {
        ...current,
        items: [...current.items, item],
      };
    });
    setSheetOpen(false);
    setEditingItem(undefined);
  }

  function updateStatus(item: TimelineItem, status: ItemStatus) {
    updateCycle((current) => ({
      ...current,
      items: updateItem(current.items, { ...item, status }),
    }));
  }

  function updateActualMinutes(item: TimelineItem, actualMinutes: number | undefined) {
    updateCycle((current) => ({
      ...current,
      items: updateItem(current.items, { ...item, actualMinutes }),
    }));
  }

  function updateSuggestion(suggestion: FreeformSuggestion) {
    updateCycle((current) => ({
      ...current,
      freeformSuggestions: current.freeformSuggestions.map((candidate) =>
        candidate.id === suggestion.id ? suggestion : candidate,
      ),
    }));
  }

  function acceptSuggestion(suggestion: FreeformSuggestion) {
    const item = createSimpleItem({
      title: suggestion.title,
      plannedStart: suggestion.plannedStart,
      plannedMinutes: suggestion.plannedMinutes ?? suggestion.actualMinutes ?? 30,
      actualMinutes: suggestion.actualMinutes,
      status: suggestion.status,
      isAlignmentRelevant: suggestion.status === "completed",
    });

    updateCycle((current) => ({
      ...current,
      items: [...current.items, item],
      freeformSuggestions: current.freeformSuggestions.filter((candidate) => candidate.id !== suggestion.id),
    }));
  }

  function generateClose() {
    updateCycle((current) => ({
      ...current,
      closeSummary: createDailyCloseSummary(current.items, reviewNotes),
    }));
  }

  function setCarryDecision(candidateId: string, decision: CarryDecision) {
    updateCycle((current) => {
      if (!current.closeSummary) {
        return current;
      }

      return {
        ...current,
        closeSummary: {
          ...current.closeSummary,
          carryCandidates: current.closeSummary.carryCandidates.map((candidate) =>
            candidate.id === candidateId ? { ...candidate, decision } : candidate,
          ),
        },
      };
    });
  }

  if (!cycle) {
    return (
      <main className="app-shell">
        <p>Loading Life Manager...</p>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <DateNavigator
        date={selectedDate}
        onPrevious={() => setSelectedDate((date) => shiftISODate(date, -1))}
        onNext={() => setSelectedDate((date) => shiftISODate(date, 1))}
        onToday={() => setSelectedDate(todayISO())}
      />

      <section className="local-notice">
        <strong>Local prototype</strong>
        <span>Data is saved only in this browser. No cloud sync or backup yet.</span>
      </section>

      {cycle.closeSummary ? <ScoreSummary summary={cycle.closeSummary} /> : <ScoreSummary summary={liveScores} />}

      <section className="action-bar">
        <button
          type="button"
          className="primary-button"
          onClick={() => {
            setEditingItem(undefined);
            setSheetOpen(true);
          }}
        >
          Add item
        </button>
        <button type="button" className="ghost-button" onClick={() => setCycle(createSeedCycle(selectedDate))}>
          Reset demo
        </button>
      </section>

      <Timeline
        items={cycle.items}
        draggingId={draggingId}
        onEdit={(item) => {
          setEditingItem(item);
          setSheetOpen(true);
        }}
        onStatusChange={updateStatus}
        onActualMinutesChange={updateActualMinutes}
        onToggleBundle={(itemId) =>
          updateCycle((current) => ({
            ...current,
            items: toggleBundle(current.items, itemId),
          }))
        }
        onMove={(itemId, direction) =>
          updateCycle((current) => ({
            ...current,
            items: moveItem(current.items, itemId, direction),
          }))
        }
        onDragStart={setDraggingId}
        onDragEnter={(itemId) => {
          if (!draggingId || draggingId === itemId) {
            return;
          }

          updateCycle((current) => ({
            ...current,
            items: reorderItems(current.items, draggingId, itemId),
          }));
        }}
        onDragEnd={() => setDraggingId(undefined)}
      />

      <FreeformCapture
        text={cycle.freeformText}
        suggestions={cycle.freeformSuggestions}
        onTextChange={(text) =>
          updateCycle((current) => ({
            ...current,
            freeformText: text,
          }))
        }
        onStructure={() =>
          updateCycle((current) => ({
            ...current,
            freeformSuggestions: parseFreeformText(current.freeformText),
          }))
        }
        onSuggestionChange={updateSuggestion}
        onAccept={acceptSuggestion}
        onDismiss={(suggestionId) =>
          updateCycle((current) => ({
            ...current,
            freeformSuggestions: current.freeformSuggestions.filter((suggestion) => suggestion.id !== suggestionId),
          }))
        }
      />

      <DailyClosePanel
        items={cycle.items}
        summary={cycle.closeSummary}
        reviewNotes={reviewNotes}
        onReviewNotesChange={setReviewNotes}
        onGenerateClose={generateClose}
        onCarryDecision={setCarryDecision}
      />

      {sheetOpen ? (
        <AddItemSheet
          editingItem={editingItem}
          onCancel={() => {
            setSheetOpen(false);
            setEditingItem(undefined);
          }}
          onSave={saveItem}
        />
      ) : null}
    </main>
  );
}
