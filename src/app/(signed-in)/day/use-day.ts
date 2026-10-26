"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  copyEntries,
  createEntry,
  deleteEntry,
  getGetDayQueryKey,
  restoreEntry,
  updateDay,
  updateEntry,
  type getDayResponse,
} from "@/lib/api/generated/days/days";
import type { CreateEntryBody, UpdateDayBody, UpdateEntryBody } from "@/lib/api/generated/lifeManagerAPI.schemas";
import { isPlanningKey } from "@/lib/day/agenda";
import type { Entry } from "@/lib/day/types";

const byOrder = (a: Entry, b: Entry) => (a.orderKey < b.orderKey ? -1 : a.orderKey > b.orderKey ? 1 : 0);

// All day writes go through here: optimistic where it is safe, then a refetch
// so totals and gates always come from the API (research R5, R6).
export function useDayMutations(date: string) {
  const queryClient = useQueryClient();
  const key = getGetDayQueryKey(date);
  // A checked task can move week goals and the agenda too (006 US4.2).
  const refresh = useCallback(() => queryClient.invalidateQueries({ predicate: (q) => isPlanningKey(q.queryKey) }), [queryClient]);

  const patchCache = (id: string, patch: Partial<Entry>) => {
    queryClient.setQueryData<getDayResponse>(key, (old) =>
      old
        ? {
            ...old,
            data: { ...old.data, entries: old.data.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)).sort(byOrder) },
          }
        : old,
    );
  };

  const create = useMutation({
    mutationFn: (body: CreateEntryBody) => createEntry(date, body),
    onSettled: refresh,
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: UpdateEntryBody }) => updateEntry(id, patch),
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<getDayResponse>(key);
      // A move to another day is left to the refetch.
      if (patch.date === undefined) patchCache(id, patch as Partial<Entry>);
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: refresh,
  });

  // Removal is optimistic so a swipe feels instant; Undo restores (004 D4).
  const remove = useMutation({
    mutationFn: (id: string) => deleteEntry(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<getDayResponse>(key);
      queryClient.setQueryData<getDayResponse>(key, (old) =>
        old ? { ...old, data: { ...old.data, entries: old.data.entries.filter((e) => e.id !== id && e.groupId !== id) } } : old,
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: refresh,
  });
  const restore = useMutation({ mutationFn: (id: string) => restoreEntry(id), onSettled: refresh });
  const updateDayFields = useMutation({ mutationFn: (body: UpdateDayBody) => updateDay(date, body), onSettled: refresh });
  const copy = useMutation({
    mutationFn: ({ fromDate, entryIds }: { fromDate: string; entryIds: string[] }) => copyEntries(date, { fromDate, entryIds }),
    onSettled: refresh,
  });

  return { create, update, remove, restore, updateDay: updateDayFields, copy };
}
