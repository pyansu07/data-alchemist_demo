// types/index.ts

export interface Client {
  ClientID: string;
  ClientName: string;
  PriorityLevel: number; // 1-5
  RequestedTaskIDs: string; // Comma-separated string as in CSV
  GroupTag?: string;
  AttributesJSON?: string; // Stringified JSON
}

export interface Worker {
  WorkerID: string;
  WorkerName: string;
  Skills: string; // Comma-separated string
  AvailableSlots: string; // String like "1,3,5" or "[1,3,5]"
  MaxLoadPerPhase: number;
  WorkerGroup?: string;
  QualificationLevel?: string;
}

export interface Task {
  TaskID: string;
  TaskName: string;
  Category?: string;
  Duration: number; // >=1
  RequiredSkills: string; // Comma-separated string
  PreferredPhases: string; // String like "1-3" or "2,4,5"
  MaxConcurrent: number;
}

export interface ParsedClient extends Omit<Client, 'RequestedTaskIDs' | 'AttributesJSON'> {
  RequestedTaskIDs: string[]; // Parsed array
  AttributesJSON?: Record<string, unknown>; // Parsed object
  [key: string]: unknown;
}

export interface ParsedWorker extends Omit<Worker, 'Skills' | 'AvailableSlots'> {
  Skills: string[]; // Parsed array
  AvailableSlots: number[]; // Parsed array
  [key: string]: unknown;
}

export interface ParsedTask extends Omit<Task, 'RequiredSkills' | 'PreferredPhases'> {
  RequiredSkills: string[]; // Parsed array
  PreferredPhases: number[]; // Parsed array
  [key: string]: unknown;
}

export type EntityType = 'clients' | 'workers' | 'tasks';

export interface ValidationError {
  id: string; // ClientID, WorkerID, TaskID
  field?: string; // Optional: specific field with error
  message: string;
  severity: 'error' | 'warning'; // For UI highlighting
  suggestion?: string; // AI ke liye
}

// Business Rules Interfaces
export interface CoRunRule {
  type: 'coRun';
  tasks: string[]; // Array of TaskIDs
}

export interface LoadLimitRule {
  type: 'loadLimit';
  workerGroup: string;
  maxSlotsPerPhase: number;
}

export interface PhaseWindowRule {
  type: 'phaseWindow';
  taskID: string;
  allowedPhases: number[];
}

// Add more rule types as needed, from the document [1]
export type BusinessRule = CoRunRule | LoadLimitRule | PhaseWindowRule;

export interface RulesConfig {
  rules: BusinessRule[];
  priorities: Record<string, number>; // e.g., { "priorityLevelFulfillment": 0.8, "fairness": 0.2 }
}