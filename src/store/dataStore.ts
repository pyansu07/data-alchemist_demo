// store/dataStore.ts
import { create } from 'zustand';
import {
  ParsedClient,
  ParsedWorker,
  ParsedTask,
  ValidationError,
  BusinessRule
} from '../types';

interface DataState {
  clients: ParsedClient[];
  workers: ParsedWorker[];
  tasks: ParsedTask[];
  validationErrors: ValidationError[];
  rules: BusinessRule[];
  priorities: Record<string, number>;
  loading: boolean;
  setClients: (clients: ParsedClient[]) => void;
  setWorkers: (workers: ParsedWorker[]) => void;
  setTasks: (tasks: ParsedTask[]) => void;
  setValidationErrors: (errors: ValidationError[]) => void;
  addRule: (rule: BusinessRule) => void;
  removeRule: (index: number) => void;
  updatePriorities: (newPriorities: Record<string, number>) => void;
  setLoading: (loading: boolean) => void;
  clearAllData: () => void;
  // 1. Naya function interface mein add karein
  applyDataModification: (action: unknown) => void;
  updateData: () => void;
}

export const useDataStore = create<DataState>((set, get) => ({
  clients: [],
  workers: [],
  tasks: [],
  validationErrors: [],
  rules: [],
  priorities: {
    priorityLevelFulfillment: 0.5,
    fairDistribution: 0.5,
    minimizingWorkload: 0.5,
  },
  loading: false,

  setClients: (clients) => set({ clients }),
  setWorkers: (workers) => set({ workers }),
  setTasks: (tasks) => set({ tasks }),
  setValidationErrors: (errors) => set({ validationErrors: errors }),
  addRule: (rule) => set((state) => ({ rules: [...state.rules, rule] })),
  removeRule: (index) =>
    set((state) => ({ rules: state.rules.filter((_, i) => i !== index) })),
  updatePriorities: (newPriorities) =>
    set((state) => ({ priorities: { ...state.priorities, ...newPriorities } })),
  setLoading: (loading) => set({ loading }),
  clearAllData: () =>
    set({
      clients: [],
      workers: [],
      tasks: [],
      validationErrors: [],
      rules: [],
      priorities: {
        priorityLevelFulfillment: 0.5,
        fairDistribution: 0.5,
        minimizingWorkload: 0.5,
      },
    }),

  // 2. Naye function ka implementation
  applyDataModification: (actionObject) => {
    const { entity, action, filter, changes } = actionObject as { entity: string; action: string; filter: Record<string, unknown>; changes: Record<string, unknown> };
    const currentState = get();

    if (!entity || !action || !filter || !changes) {
      console.error("Invalid action object received:", actionObject);
      return;
    }

    let updatedData;
    const dataToUpdate = currentState[entity as keyof typeof currentState] as unknown[];

    if (!dataToUpdate) {
      console.error(`Entity "${entity}" not found in data store.`);
      return;
    }

    if (action === 'update_many') {
      updatedData = dataToUpdate.map(item => {
        const typedItem = item as Record<string, unknown>;
        // Check karein ki item filter criteria se match karta hai ya nahi
        const isMatch = Object.entries(filter).every(
          ([key, value]) => typedItem[key] === value
        );

        if (isMatch) {
          // Agar match karta hai, toh naye changes ke saath return karein
          return { ...typedItem, ...changes };
        }
        return item; // Agar match nahi karta, toh item ko waise hi rakhein
      });
    } else {
      console.warn(`Action type "${action}" is not yet implemented.`);
      return; // Abhi ke liye sirf update_many handle karein
    }

    // Store ko naye, updated data ke saath set karein
    set({ [entity]: updatedData });
  },
  updateData: () => {
    // Not implemented
  },
}));
