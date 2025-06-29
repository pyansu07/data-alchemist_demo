// lib/validators.ts
import { ParsedClient, ParsedWorker, ParsedTask, ValidationError } from '../types';

interface AllData {
  clients: ParsedClient[];
  workers: ParsedWorker[];
  tasks: ParsedTask[];
}

export const runValidations = ({ clients, workers, tasks }: AllData): ValidationError[] => {
  const errors: ValidationError[] = [];

  const allTaskIds = new Set(tasks.map((t) => t.TaskID));
  const allWorkerSkills = new Set(workers.flatMap((w) => w.Skills));


  // Helper for adding error
  const addError = (id: string, message: string, field?: string, severity: 'error' | 'warning' = 'error') => {
    errors.push({ id, message, field, severity });
  };

  // --- 1. Missing required column(s) & Empty values ---
  clients.forEach((c) => {
    if (!c.ClientID) addError(c.ClientID || 'unknown', 'Missing ClientID', 'ClientID');
    if (!c.ClientName) addError(c.ClientID, 'Missing ClientName', 'ClientName');
    if (typeof c.PriorityLevel !== 'number' || isNaN(c.PriorityLevel)) addError(c.ClientID, 'Missing or invalid PriorityLevel', 'PriorityLevel');
  });
  workers.forEach((w) => {
    if (!w.WorkerID) addError(w.WorkerID || 'unknown', 'Missing WorkerID', 'WorkerID');
    if (!w.WorkerName) addError(w.WorkerID, 'Missing WorkerName', 'WorkerName');
    if (typeof w.MaxLoadPerPhase !== 'number' || isNaN(w.MaxLoadPerPhase)) addError(w.WorkerID, 'Missing or invalid MaxLoadPerPhase', 'MaxLoadPerPhase');
  });
  tasks.forEach((t) => {
    if (!t.TaskID) addError(t.TaskID || 'unknown', 'Missing TaskID', 'TaskID');
    if (!t.TaskName) addError(t.TaskID, 'Missing TaskName', 'TaskName');
    if (typeof t.Duration !== 'number' || isNaN(t.Duration)) addError(t.TaskID, 'Missing or invalid Duration', 'Duration');
    if (typeof t.MaxConcurrent !== 'number' || isNaN(t.MaxConcurrent)) addError(t.TaskID, 'Missing or invalid MaxConcurrent', 'MaxConcurrent');
  });

  // --- 2. Duplicate IDs ---
  const checkDuplicates = (items: unknown[], idField: string, entityType: string) => {
    const seenIds = new Set();
    items.forEach((item) => {
      const typedItem = item as Record<string, unknown>;
      const id = typedItem[idField];
      if (id !== undefined && seenIds.has(id)) {
        errors.push({
          id: String(id),
          message: `Duplicate ${entityType} ID found: ${id}`,
          severity: 'error',
        });
      }
      seenIds.add(id);
    });
  };
  checkDuplicates(clients, 'ClientID', 'Client');
  checkDuplicates(workers, 'WorkerID', 'Worker');
  checkDuplicates(tasks, 'TaskID', 'Task');

  // --- 3. Malformed lists & Out-of-range values ---
  clients.forEach((c) => {
    if (!Array.isArray(c.RequestedTaskIDs)) addError(c.ClientID, 'RequestedTaskIDs is not an array', 'RequestedTaskIDs');
    if (c.PriorityLevel < 1 || c.PriorityLevel > 5) addError(c.ClientID, 'PriorityLevel must be between 1 and 5', 'PriorityLevel');
    if (c.AttributesJSON && typeof c.AttributesJSON !== 'object') addError(c.ClientID, 'AttributesJSON is malformed', 'AttributesJSON');
  });
  workers.forEach((w) => {
    if (!Array.isArray(w.Skills) || w.Skills.some(s => typeof s !== 'string')) addError(w.WorkerID, 'Skills must be an array of strings', 'Skills');
    if (!Array.isArray(w.AvailableSlots) || w.AvailableSlots.some(s => typeof s !== 'number' || isNaN(s))) addError(w.WorkerID, 'AvailableSlots must be an array of numbers', 'AvailableSlots');
    if (w.MaxLoadPerPhase < 0) addError(w.WorkerID, 'MaxLoadPerPhase cannot be negative', 'MaxLoadPerPhase');
  });
  tasks.forEach((t) => {
    if (t.Duration < 1) addError(t.TaskID, 'Duration must be at least 1', 'Duration');
    if (!Array.isArray(t.RequiredSkills) || t.RequiredSkills.some(s => typeof s !== 'string')) addError(t.TaskID, 'RequiredSkills must be an array of strings', 'RequiredSkills');
    if (!Array.isArray(t.PreferredPhases) || t.PreferredPhases.some(p => typeof p !== 'number' || isNaN(p) || p < 1)) addError(t.TaskID, 'PreferredPhases must be an array of positive numbers', 'PreferredPhases');
    if (t.MaxConcurrent < 1) addError(t.TaskID, 'MaxConcurrent must be at least 1', 'MaxConcurrent');
  });

  // --- 4. Unknown references (Clients -> Tasks) ---
  clients.forEach((c) => {
    c.RequestedTaskIDs.forEach((taskId) => {
      if (!allTaskIds.has(taskId)) {
        addError(c.ClientID, `Requested Task ID "${taskId}" does not exist`, 'RequestedTaskIDs');
      }
    });
  });

  // --- 5. Skill-coverage matrix (Tasks -> Workers) ---
  tasks.forEach((t) => {
    t.RequiredSkills.forEach((requiredSkill) => {
      if (!allWorkerSkills.has(requiredSkill)) {
        addError(t.TaskID, `No worker found with skill "${requiredSkill}"`, 'RequiredSkills', 'warning');
      }
    });
  });

  // --- 6. Overloaded workers (initial check based on MaxLoadPerPhase vs AvailableSlots length) ---
  workers.forEach((w) => {
    if (w.AvailableSlots.length < w.MaxLoadPerPhase) {
      addError(w.WorkerID, `Worker has fewer available slots (${w.AvailableSlots.length}) than MaxLoadPerPhase (${w.MaxLoadPerPhase})`, 'MaxLoadPerPhase', 'warning');
    }
  });


  // --- 7. Validate Task.PreferredPhases are valid phase numbers (e.g. positive integers)
  tasks.forEach(t => {
    t.PreferredPhases.forEach(phase => {
      if (typeof phase !== 'number' || isNaN(phase) || phase < 1 || !Number.isInteger(phase)) {
        addError(t.TaskID, `Invalid phase number in PreferredPhases: ${phase}`, 'PreferredPhases');
      }
    });
  });

  // --- 8. Worker Skills format validation (ensure non-empty strings)
  workers.forEach(w => {
    if (w.Skills.some(skill => typeof skill !== 'string' || skill.trim() === '')) {
      addError(w.WorkerID, 'Skills array contains empty or non-string values', 'Skills');
    }
  });

  return errors;
};
