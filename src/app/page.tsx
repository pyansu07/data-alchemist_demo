'use client';
import { Container, Text, Stack, HStack } from '@chakra-ui/react';
import { Tabs as ChakraTabs } from '@chakra-ui/react';
import FileUploader from '../components/FileUploader';
import DataTable from '../components/DataTable';
import ValidationSummary from '../components/ValidationSummary';
import NLSearch from '../components/NLSearch';
import RuleEditor from '../components/RuleEditor';
import PrioritySetter from '../components/PrioritySetter';
import ExportSection from '../components/ExportSection';
import { useDataStore } from '../store/dataStore';
import { clientsColumns, workersColumns, tasksColumns } from '../lib/tableColumns';
import { useState, useMemo } from 'react';
import { ParsedClient, ParsedWorker, ParsedTask, EntityType } from '../types';
import { ColorModeButton } from '../components/ui/color-mode';
// 1. AICoPilotPanel ko import karein
import { AICoPilotPanel } from '../components/AICoPilotPanel';

interface Filter {
  field: string;
  operator: string;
  value: string | number | boolean;
}

export default function HomePage() {
  const { clients, workers, tasks } = useDataStore();
  const [clientFilters, setClientFilters] = useState<Filter[]>([]);
  const [workerFilters, setWorkerFilters] = useState<Filter[]>([]);
  const [taskFilters, setTaskFilters] = useState<Filter[]>([]);

  const applyFilters = <T extends ParsedClient | ParsedWorker | ParsedTask>(data: T[], filters: Filter[]): T[] => {
    if (!filters || filters.length === 0) {
      return data;
    }
    return data.filter((item) => {
      return filters.every((filter) => {
        const valueInItem = (item as unknown as Record<string, unknown>)[filter.field];
        if (valueInItem === undefined || valueInItem === null) return false;
        switch (filter.operator) {
          case '=': return valueInItem === filter.value;
          case '>': return valueInItem > filter.value;
          case '<': return valueInItem < filter.value;
          case '>=': return valueInItem >= filter.value;
          case '<=': return valueInItem <= filter.value;
          case 'includes':
            if (Array.isArray(valueInItem)) return valueInItem.includes(filter.value);
            return String(valueInItem).includes(String(filter.value));
          default: return false;
        }
      });
    });
  };

  const filteredClients = useMemo(() => applyFilters(clients, clientFilters), [clients, clientFilters]);
  const filteredWorkers = useMemo(() => applyFilters(workers, workerFilters), [workers, workerFilters]);
  const filteredTasks = useMemo(() => applyFilters(tasks, taskFilters), [tasks, taskFilters]);

  // AI search se mile filters ko set karne ke liye naya handler
  const handleClientFilter = (filteredData: unknown[]) => {
    setClientFilters(filteredData as Filter[]);
  };
  const handleWorkerFilter = (filteredData: unknown[]) => {
    setWorkerFilters(filteredData as Filter[]);
  };
  const handleTaskFilter = (filteredData: unknown[]) => {
    setTaskFilters(filteredData as Filter[]);
  };

  // 2. Co-Pilot se data modify hone par filter reset karne ke liye naya handler
  const handleDataModified = (entityType: EntityType) => {
    // Jis entity ka data badla hai, sirf usi ka filter reset karein
    if (entityType === 'clients') setClientFilters([]);
    else if (entityType === 'workers') setWorkerFilters([]);
    else if (entityType === 'tasks') setTaskFilters([]);
  };

  return (
    <Container maxW="container.xl" py={8}>
      <HStack justifyContent="space-between" mb={6}>
        <Text fontSize="4xl" fontWeight="bold" color="blue.700">
          Data Alchemist
        </Text>
        <ColorModeButton />
      </HStack>

      <ChakraTabs.Root fitted variant="enclosed" mt={8}>
        <ChakraTabs.List mb="1em">
          <ChakraTabs.Trigger value="upload">Upload & Validate Data</ChakraTabs.Trigger>
          <ChakraTabs.Trigger value="rules">Define Rules</ChakraTabs.Trigger>
          <ChakraTabs.Trigger value="priorities">Set Priorities</ChakraTabs.Trigger>
        </ChakraTabs.List>
        <ChakraTabs.Content value="upload">
          <Stack gap={8}>
            <FileUploader />
            <ValidationSummary />
            <ChakraTabs.Root variant="enclosed" colorScheme="green" mt={8}>
              <ChakraTabs.List>
                <ChakraTabs.Trigger value="clients">Clients Data</ChakraTabs.Trigger>
                <ChakraTabs.Trigger value="workers">Workers Data</ChakraTabs.Trigger>
                <ChakraTabs.Trigger value="tasks">Tasks Data</ChakraTabs.Trigger>
              </ChakraTabs.List>
              <ChakraTabs.Content value="clients">
                <NLSearch onFilter={handleClientFilter} entityType="clients" />
                <DataTable<ParsedClient> data={filteredClients} columns={clientsColumns} entityType="clients" />
              </ChakraTabs.Content>
              <ChakraTabs.Content value="workers">
                <NLSearch onFilter={handleWorkerFilter} entityType="workers" />
                <DataTable<ParsedWorker> data={filteredWorkers} columns={workersColumns} entityType="workers" />
              </ChakraTabs.Content>
              <ChakraTabs.Content value="tasks">
                <NLSearch onFilter={handleTaskFilter} entityType="tasks" />
                <DataTable<ParsedTask> data={filteredTasks} columns={tasksColumns} entityType="tasks" />
              </ChakraTabs.Content>
            </ChakraTabs.Root>
          </Stack>
        </ChakraTabs.Content>
        <ChakraTabs.Content value="rules">
          <RuleEditor />
        </ChakraTabs.Content>
        <ChakraTabs.Content value="priorities">
          <PrioritySetter />
          <ExportSection />
        </ChakraTabs.Content>
      </ChakraTabs.Root>

      {/* 3. AICoPilotPanel ko yahan render karein aur naya prop pass karein */}
      <AICoPilotPanel onDataModified={handleDataModified} />
    </Container>
  );
}
