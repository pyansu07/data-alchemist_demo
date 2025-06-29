// components/FileUploader.tsx
'use client';
import {
  Box,
  Input,
  Text,
  Stack,
} from '@chakra-ui/react';
import { toaster } from '../components/ui/toaster';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { useDataStore } from '../store/dataStore';
import { Client, ParsedClient, Worker, ParsedWorker, Task, ParsedTask, EntityType } from '../types';
import { runValidations } from '../lib/validators';

// Helper to parse comma-separated string to array (and handle empty strings)
const parseStringToArray = (str: string | undefined): string[] => {
  if (!str) return [];
  return str.split(',').map((s) => s.trim()).filter(Boolean);
};

// Helper to parse array of numbers from string (e.g., "[1,3,5]" or "1,3,5")
const parseNumericArray = (str: string | undefined): number[] => {
  if (!str) return [];
  try {
    const parsed = JSON.parse(str);
    if (Array.isArray(parsed) && parsed.every(item => typeof item === 'number')) {
      return parsed;
    }
  } catch {
    // Fallback to comma-separated
  }
  return str.split(',').map(Number).filter(n => !isNaN(n));
};

// Helper to parse PreferredPhases string (e.g., "1-3" or "2,4,5")
const parsePreferredPhases = (str: string | undefined): number[] => {
  if (!str) return [];
  if (str.includes('-')) {
    const [start, end] = str.split('-').map(Number);
    if (isNaN(start) || isNaN(end) || start > end) return [];
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }
  return parseNumericArray(str);
};


const FileUploader = () => {
  const { setClients, setWorkers, setTasks, setValidationErrors, setLoading, clients, workers, tasks } = useDataStore();

  const processFile = async (file: File, entityType: EntityType) => {
    setLoading(true);
    const reader = new FileReader();

    reader.onload = async (e) => {
      const text = e.target?.result as string;
      let parsedData: unknown[] = [];

      try {
        if (file.name.endsWith('.csv')) {
          Papa.parse(text, {
            header: true,
            dynamicTyping: true, // Tries to convert strings to numbers/booleans
            skipEmptyLines: true,
            complete: (results) => {
              parsedData = results.data;
              handleParsedData(parsedData, entityType);
            },
            error: (err: unknown) => {
              toaster.create({
                title: 'Parsing Error',
                description: `Could not parse CSV for ${entityType}: ${err instanceof Error ? err.message : 'Unknown error'}`,
                type: 'error',
              });
              setLoading(false);
            },
          });
        } else if (file.name.endsWith('.xlsx')) {
          try {
            const workbook = XLSX.read(text, { type: 'array' });

            if (workbook.SheetNames.length === 0) {
              throw new Error('No sheets found in the Excel file');
            }

            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Check if worksheet has data
            const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');

            if (range.e.r === 0 && range.e.c === 0) {
              throw new Error('Worksheet appears to be empty');
            }

            parsedData = XLSX.utils.sheet_to_json(worksheet);

            if (parsedData.length === 0) {
              throw new Error('No data rows found in the Excel file');
            }

            handleParsedData(parsedData, entityType);
          } catch (xlsxError: unknown) {
            toaster.create({
              title: 'Excel File Error',
              description: `Failed to process Excel file: ${xlsxError instanceof Error ? xlsxError.message : 'Unknown error'}`,
              type: 'error',
            });
            setLoading(false);
          }
        } else {
          toaster.create({
            title: 'Invalid File Type',
            description: 'Please upload a CSV or XLSX file.',
            type: 'error',
          });
          setLoading(false);
        }
      } catch (error: unknown) {
        toaster.create({
          title: 'File Processing Error',
          description: `Failed to process ${entityType} file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          type: 'error',
        });
        setLoading(false);
      }
    };

    if (file.name.endsWith('.xlsx')) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleParsedData = (data: unknown[], entityType: EntityType) => {
    try {
      let transformedData: (ParsedClient | ParsedWorker | ParsedTask)[] = [];
      if (entityType === 'clients') {
        transformedData = data.map((row) => {
          const client = row as Client;
          return {
            ClientID: String(client.ClientID),
            ClientName: String(client.ClientName || ''),
            PriorityLevel: Number(client.PriorityLevel) || 0,
            RequestedTaskIDs: parseStringToArray(client.RequestedTaskIDs),
            GroupTag: client.GroupTag ? String(client.GroupTag) : undefined,
            AttributesJSON: client.AttributesJSON ? (() => {
              try {
                return JSON.parse(client.AttributesJSON);
              } catch {
                return undefined;
              }
            })() : undefined,
          };
        });
        setClients(transformedData as ParsedClient[]);
      } else if (entityType === 'workers') {
        transformedData = data.map((row) => {
          const worker = row as Worker;
          return {
            WorkerID: String(worker.WorkerID),
            WorkerName: String(worker.WorkerName || ''),
            Skills: parseStringToArray(worker.Skills),
            AvailableSlots: parseNumericArray(worker.AvailableSlots),
            MaxLoadPerPhase: Number(worker.MaxLoadPerPhase) || 0,
            WorkerGroup: worker.WorkerGroup ? String(worker.WorkerGroup) : undefined,
            QualificationLevel: worker.QualificationLevel ? String(worker.QualificationLevel) : undefined,
          };
        });
        setWorkers(transformedData as ParsedWorker[]);
      } else if (entityType === 'tasks') {
        transformedData = data.map((row) => {
          const task = row as Task;
          return {
            TaskID: String(task.TaskID),
            TaskName: String(task.TaskName || ''),
            Category: task.Category ? String(task.Category) : undefined,
            Duration: Number(task.Duration) || 0,
            RequiredSkills: parseStringToArray(task.RequiredSkills),
            PreferredPhases: parsePreferredPhases(task.PreferredPhases),
            MaxConcurrent: Number(task.MaxConcurrent) || 0,
          };
        });
        setTasks(transformedData as ParsedTask[]);
      }

      toaster.create({
        title: 'Upload Successful',
        description: `${entityType} data loaded and parsed.`,
        type: 'success',
      });

      // Run validations after all data is loaded/updated
      const currentClients = entityType === 'clients' ? (transformedData as ParsedClient[]) : clients;
      const currentWorkers = entityType === 'workers' ? (transformedData as ParsedWorker[]) : workers;
      const currentTasks = entityType === 'tasks' ? (transformedData as ParsedTask[]) : tasks;
      const errors = runValidations({ clients: currentClients, workers: currentWorkers, tasks: currentTasks });
      setValidationErrors(errors);

    } catch {
      toaster.create({
        title: 'Data Transformation Error',
        description: `Failed to transform ${entityType} data. Check column names and data types.`,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };


  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, entityType: EntityType) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file, entityType);
    } else {
      console.log('No file selected');
    }
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg">
      <Text fontSize="xl" mb={4}>Upload Data Files</Text>
      <Stack gap={4}>
        {['clients', 'workers', 'tasks'].map((entity) => (
          <Box key={entity}>
            <Text mb={2} fontWeight="bold">{entity.charAt(0).toUpperCase() + entity.slice(1)} Data ({entity}.csv/.xlsx)</Text>
            <Input
              type="file"
              accept=".csv,.xlsx"
              onChange={(e) => handleFileUpload(e, entity as EntityType)}
              p={1}
            />
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

export default FileUploader;
