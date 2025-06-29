// components/PrioritySetter.tsx
'use client';
import { Box, Text, VStack, HStack, Button } from '@chakra-ui/react';
import { toaster } from '../components/ui/toaster';
import { useDataStore } from '../store/dataStore';
import { useState, useEffect } from 'react';

const PrioritySetter = () => {
  const { priorities, updatePriorities } = useDataStore();
  const [localPriorities, setLocalPriorities] = useState(priorities);

  // Sync local state with global store when global store changes
  useEffect(() => {
    setLocalPriorities(priorities);
  }, [priorities]);

  const handleSliderChange = (key: string, value: number) => {
    setLocalPriorities((prev) => ({
      ...prev,
      [key]: value / 100, // Convert to 0-1 range for internal use
    }));
  };

  const handleSavePriorities = () => {
    updatePriorities(localPriorities);
    toaster.create({
      title: 'Priorities Saved',
      description: 'Allocation priorities have been updated.',
      type: 'success',
    });
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg">
      <Text fontSize="xl" mb={4}>Set Allocation Priorities</Text>
      <VStack gap={8} align="stretch">
        <Box>
          <Text mb={2} fontWeight="bold">Priority Level Fulfillment ({Math.round(localPriorities.priorityLevelFulfillment * 100)}%)</Text>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={localPriorities.priorityLevelFulfillment * 100}
            onChange={(e) => handleSliderChange('priorityLevelFulfillment', Number(e.target.value))}
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              background: 'linear-gradient(to right, #e2e8f0 0%, #e2e8f0 25%, #3182ce 25%, #3182ce 50%, #3182ce 75%, #3182ce 100%)',
              outline: 'none',
              opacity: '0.7',
              transition: 'opacity 0.2s',
            }}
          />
          <HStack justify="space-between" mt={1}>
            <Text fontSize="sm">0%</Text>
            <Text fontSize="sm">25%</Text>
            <Text fontSize="sm">50%</Text>
            <Text fontSize="sm">75%</Text>
            <Text fontSize="sm">100%</Text>
          </HStack>
        </Box>

        <Box>
          <Text mb={2} fontWeight="bold">Fair Distribution ({Math.round(localPriorities.fairDistribution * 100)}%)</Text>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={localPriorities.fairDistribution * 100}
            onChange={(e) => handleSliderChange('fairDistribution', Number(e.target.value))}
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              background: 'linear-gradient(to right, #e2e8f0 0%, #e2e8f0 25%, #3182ce 25%, #3182ce 50%, #3182ce 75%, #3182ce 100%)',
              outline: 'none',
              opacity: '0.7',
              transition: 'opacity 0.2s',
            }}
          />
          <HStack justify="space-between" mt={1}>
            <Text fontSize="sm">0%</Text>
            <Text fontSize="sm">25%</Text>
            <Text fontSize="sm">50%</Text>
            <Text fontSize="sm">75%</Text>
            <Text fontSize="sm">100%</Text>
          </HStack>
        </Box>

        <Box>
          <Text mb={2} fontWeight="bold">Minimizing Workload ({Math.round(localPriorities.minimizingWorkload * 100)}%)</Text>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={localPriorities.minimizingWorkload * 100}
            onChange={(e) => handleSliderChange('minimizingWorkload', Number(e.target.value))}
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              background: 'linear-gradient(to right, #e2e8f0 0%, #e2e8f0 25%, #3182ce 25%, #3182ce 50%, #3182ce 75%, #3182ce 100%)',
              outline: 'none',
              opacity: '0.7',
              transition: 'opacity 0.2s',
            }}
          />
          <HStack justify="space-between" mt={1}>
            <Text fontSize="sm">0%</Text>
            <Text fontSize="sm">25%</Text>
            <Text fontSize="sm">50%</Text>
            <Text fontSize="sm">75%</Text>
            <Text fontSize="sm">100%</Text>
          </HStack>
        </Box>
        <Button colorScheme="blue" onClick={handleSavePriorities}>
          Save Priorities
        </Button>
      </VStack>
    </Box>
  );
};

export default PrioritySetter;
