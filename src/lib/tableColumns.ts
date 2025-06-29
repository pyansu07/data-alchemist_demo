// lib/tableColumns.ts
import { ColumnDef } from '@tanstack/react-table';
import { ParsedClient, ParsedWorker, ParsedTask } from '../types';

export const clientsColumns: ColumnDef<ParsedClient>[] = [
  {
    accessorKey: 'ClientID',
    header: 'Client ID',
    size: 100,
  },
  {
    accessorKey: 'ClientName',
    header: 'Client Name',
    size: 150,
  },
  {
    accessorKey: 'PriorityLevel',
    header: 'Priority Level (1-5)',
    size: 100,
  },
  {
    accessorKey: 'RequestedTaskIDs',
    header: 'Requested Task IDs',
    size: 200,
    cell: ({ getValue }) => (Array.isArray(getValue()) ? (getValue() as unknown[]).join(', ') : String(getValue())),
  },
  {
    accessorKey: 'GroupTag',
    header: 'Group Tag',
    size: 100,
  },
  {
    accessorKey: 'AttributesJSON',
    header: 'Attributes JSON',
    size: 200,
    cell: ({ getValue }) => (typeof getValue() === 'object' ? JSON.stringify(getValue()) : ''),
  },
];

export const workersColumns: ColumnDef<ParsedWorker>[] = [
  {
    accessorKey: 'WorkerID',
    header: 'Worker ID',
  },
  {
    accessorKey: 'WorkerName',
    header: 'Worker Name',
  },
  {
    accessorKey: 'Skills',
    header: 'Skills',
    cell: ({ getValue }) => (Array.isArray(getValue()) ? (getValue() as unknown[]).join(', ') : String(getValue())),
  },
  {
    accessorKey: 'AvailableSlots',
    header: 'Available Slots',
    cell: ({ getValue }) => (Array.isArray(getValue()) ? (getValue() as unknown[]).join(', ') : String(getValue())),
  },
  {
    accessorKey: 'MaxLoadPerPhase',
    header: 'Max Load Per Phase',
  },
  {
    accessorKey: 'WorkerGroup',
    header: 'Worker Group',
  },
  {
    accessorKey: 'QualificationLevel',
    header: 'Qualification Level',
  },
];

export const tasksColumns: ColumnDef<ParsedTask>[] = [
  {
    accessorKey: 'TaskID',
    header: 'Task ID',
  },
  {
    accessorKey: 'TaskName',
    header: 'Task Name',
  },
  {
    accessorKey: 'Category',
    header: 'Category',
  },
  {
    accessorKey: 'Duration',
    header: 'Duration (Phases)',
  },
  {
    accessorKey: 'RequiredSkills',
    header: 'Required Skills',
    cell: ({ getValue }) => (Array.isArray(getValue()) ? (getValue() as unknown[]).join(', ') : String(getValue())),
  },
  {
    accessorKey: 'PreferredPhases',
    header: 'Preferred Phases',
    cell: ({ getValue }) => (Array.isArray(getValue()) ? (getValue() as unknown[]).join(', ') : String(getValue())),
  },
  {
    accessorKey: 'MaxConcurrent',
    header: 'Max Concurrent',
  },
];