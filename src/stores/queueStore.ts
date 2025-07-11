import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Represents a single prompt queued for generation.
 */
export interface QueueItem {
  promptId: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  /** Populated when status === 'error'. */
  error?: string;
}

/** Persisted localStorage key (must survive refresh). */
const LS_KEY = 'historify_generation_queue_v2';

/** Default concurrency (max simultaneous generations). */
const DEFAULT_CONCURRENCY = Number(
  import.meta.env.NEXT_PUBLIC_GEN_CONCURRENCY ?? 5,
);

interface QueueState {
  items: QueueItem[];
  concurrency: number;
  /** Add one or more prompt IDs to the queue (duplicates ignored). */
  enqueue: (promptIds: string | string[]) => void;
  /** Remove a prompt from the queue irrespective of status. */
  remove: (promptId: string) => void;
  /** Clear the entire queue. */
  clear: () => void;
  /** Internal: update status of an item. */
  setStatus: (
    promptId: string,
    status: QueueItem['status'],
    error?: string,
  ) => void;
  /** Derived helpers (selectors) */
  pending: () => QueueItem[];
  processing: () => QueueItem[];
  completed: () => QueueItem[];
}

export const useQueueStore = create<QueueState>()(
  persist(
    (set, get) => ({
      items: [],
      concurrency: DEFAULT_CONCURRENCY,
      enqueue: (promptIds) => {
        const ids = Array.isArray(promptIds) ? promptIds : [promptIds];
        if (ids.length === 0) return;
        set((state) => {
          const existing = new Set(state.items.map((i) => i.promptId));
          const appended = ids.filter((id) => !existing.has(id)).map((id) => ({
            promptId: id,
            status: 'pending' as const,
          }));
          return { items: [...state.items, ...appended] };
        });
      },
      remove: (promptId) =>
        set((state) => ({
          items: state.items.filter((i) => i.promptId !== promptId),
        })),
      clear: () => set({ items: [] }),
      setStatus: (promptId, status, error) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.promptId === promptId ? { ...i, status, error } : i,
          ),
        })),
      pending: () => get().items.filter((i) => i.status === 'pending'),
      processing: () => get().items.filter((i) => i.status === 'processing'),
      completed: () =>
        get().items.filter((i) => i.status === 'done' || i.status === 'error'),
    }),
    {
      name: LS_KEY,
      partialize: (state) => ({ items: state.items }), // persist only items; concurrency from env each load
    },
  ),
);

// Helper to fetch next batch up to concurrency limit. UI or queue runner can call this.
export function getNextBatch(): QueueItem[] {
  const { pending, processing, concurrency } = useQueueStore.getState();
  const slotsAvailable = concurrency - processing().length;
  if (slotsAvailable <= 0) return [];
  return pending().slice(0, slotsAvailable);
}
