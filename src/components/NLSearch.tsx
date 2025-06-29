// components/NLSearch.tsx
'use client';
import { useState, useMemo } from 'react';
import { Box, Input, Button, Stack, Text, Spinner } from '@chakra-ui/react';
import { toaster } from '../components/ui/toaster';
import { useDataStore } from '../store/dataStore';
import { EntityType } from '../types';

interface NLSearchProps {
  onFilter: (filteredData: unknown[], entityType: EntityType) => void;
  entityType: EntityType;
}

const NLSearch = ({ onFilter, entityType }: NLSearchProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { clients, workers, tasks } = useDataStore();

  const dataToFilter = useMemo(() => {
    if (entityType === 'clients') return clients;
    if (entityType === 'workers') return workers;
    if (entityType === 'tasks') return tasks;
    return [];
  }, [entityType, clients, workers, tasks]);

  // Define schemas to send to AI
  const schemas = useMemo(() => {
    const baseClient = { ClientID: "string", ClientName: "string", PriorityLevel: "number (1-5)", RequestedTaskIDs: "array of strings", GroupTag: "string (optional)", AttributesJSON: "object (optional)" };
    const baseWorker = { WorkerID: "string", WorkerName: "string", Skills: "array of strings", AvailableSlots: "array of numbers", MaxLoadPerPhase: "number", WorkerGroup: "string (optional)", QualificationLevel: "string (optional)" };
    const baseTask = { TaskID: "string", TaskName: "string", Category: "string (optional)", Duration: "number (>=1)", RequiredSkills: "array of strings", PreferredPhases: "array of numbers", MaxConcurrent: "number" };

    if (entityType === 'clients') return JSON.stringify(baseClient, null, 2);
    if (entityType === 'workers') return JSON.stringify(baseWorker, null, 2);
    if (entityType === 'tasks') return JSON.stringify(baseTask, null, 2);
    return '';
  }, [entityType]);


  const applyFilters = (data: unknown[], filters: unknown[]): unknown[] => {
    return data.filter((item) => {
      const typedItem = item as Record<string, unknown>;
      return filters.every((filter) => {
        const typedFilter = filter as { field: string; value: unknown; operator: string };
        const valueInItem = typedItem[typedFilter.field];
        if (valueInItem === undefined || valueInItem === null) return false;

        switch (typedFilter.operator) {
          case '=':
            return valueInItem === typedFilter.value;
          case '>':
            return Number(valueInItem) > Number(typedFilter.value);
          case '<':
            return Number(valueInItem) < Number(typedFilter.value);
          case '>=':
            return Number(valueInItem) >= Number(typedFilter.value);
          case '<=':
            return Number(valueInItem) <= Number(typedFilter.value);
          case 'includes': // For array fields like Skills, RequestedTaskIDs, PreferredPhases
            if (Array.isArray(valueInItem)) {
              return valueInItem.includes(typedFilter.value);
            }
            return String(valueInItem).includes(String(typedFilter.value)); // Fallback for string
          case 'excludes':
            if (Array.isArray(valueInItem)) {
              return !valueInItem.includes(typedFilter.value);
            }
            return !String(valueInItem).includes(String(typedFilter.value));
          // Add more operators as needed
          default:
            return true;
        }
      });
    });
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      onFilter(dataToFilter, entityType); // Show all data if query is empty
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, entityType, dataSchema: schemas }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch AI filters.');
      }

      const { filters } = await response.json();

      if (filters && filters.length > 0) {
        const filteredData = applyFilters(dataToFilter, filters);
        onFilter(filteredData, entityType);
        toaster.create({
          title: 'Search Successful',
          description: `Found ${filteredData.length} matching records.`,
          type: 'success',
        });
      } else {
        onFilter([], entityType); // No filters, show empty or all? Decided to show empty
        toaster.create({
          title: 'No Matching Filters',
          description: 'AI could not derive filters from your query, or no records matched.',
          type: 'info',
        });
      }
    } catch (error: unknown) {
      toaster.create({
        title: 'AI Search Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred during AI search.',
        type: 'error',
      });
      onFilter(dataToFilter, entityType); // Revert to showing all data on error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" mt={4}>
      <Text fontSize="xl" mb={4}>Natural Language Search for {entityType.charAt(0).toUpperCase() + entityType.slice(1)}</Text>
      <Stack direction={{ base: 'column', md: 'row' }} gap={3}>
        <Input
          placeholder={`e.g., "All tasks having a Duration of more than 1 phase"`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch();
          }}
        />
        <Button onClick={handleSearch} colorScheme="blue" loading={isLoading} loadingText="Searching...">
          {isLoading ? <Spinner size="sm" /> : "Search with AI"}
        </Button>
        <Button onClick={() => {
          setSearchQuery('');
          onFilter(dataToFilter, entityType);
          toaster.create({
            title: 'Search Cleared',
            description: 'Displaying all data.',
            type: 'info',
          });
        }} variant="outline">
          Clear Search
        </Button>
      </Stack>
    </Box>
  );
};

export default NLSearch;
