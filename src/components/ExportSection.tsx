// components/ExportSection.tsx
'use client';
import { Box, Button, HStack, Text } from '@chakra-ui/react';
import { toaster } from '../components/ui/toaster';
import { useDataStore } from '../store/dataStore';
import { useState } from 'react';
// import Papa from 'papaparse';
// import * as XLSX from 'xlsx';

const ExportSection = () => {
  const { clients, workers, tasks, rules, priorities } = useDataStore();
  const [isExportingData, setIsExportingData] = useState(false);
  const [isExportingRules, setIsExportingRules] = useState(false);

  const handleExportData = async (entityType: 'clients' | 'workers' | 'tasks', format: 'csv' | 'xlsx') => {
    setIsExportingData(true);
    let dataToExport: unknown[] = [];
    let fileName = '';
    const apiRoute = `/api/export/data?entityType=${entityType}&format=${format}`;

    if (entityType === 'clients') {
      dataToExport = clients;
      fileName = 'clients';
    } else if (entityType === 'workers') {
      dataToExport = workers;
      fileName = 'workers';
    } else if (entityType === 'tasks') {
      dataToExport = tasks;
      fileName = 'tasks';
    }

    if (dataToExport.length === 0) {
      toaster.create({
        title: 'No Data',
        description: `No ${entityType} data to export. Please upload files first.`,
        type: 'warning',
      });
      setIsExportingData(false);
      return;
    }

    try {
      const response = await fetch(apiRoute, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToExport) // Send the current state of data
      });

      if (!response.ok) {
        const errorData: unknown = await response.json();
        throw new Error(`Export failed: ${(errorData as { error?: string })?.error || 'Unknown error'}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toaster.create({
        title: 'Export Successful',
        description: `${entityType} data exported as ${format.toUpperCase()}.`,
        type: 'success',
      });
    } catch (error: unknown) {
      console.error('Export error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toaster.create({
        title: 'Export Error',
        description: errorMessage,
        type: 'error',
      });
    } finally {
      setIsExportingData(false);
    }
  };

  const handleExportRules = async () => {
    setIsExportingRules(true);
    try {
      const rulesConfig = { rules, priorities };

      // client-side generation, simpler for now
      const jsonString = JSON.stringify(rulesConfig, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'rules.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toaster.create({
        title: 'Rules Exported',
        description: 'rules.json file generated and downloaded.',
        type: 'success',
      });
    } catch (error: unknown) {
      console.error('Export error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toaster.create({
        title: 'Export Error',
        description: errorMessage || 'Failed to export rules.',
        type: 'error',
      });
    } finally {
      setIsExportingRules(false);
    }
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" mt={4}>
      <Text fontSize="xl" mb={4}>Export Data and Rules</Text>
      <HStack gap={4} wrap="wrap">
        <Button
          colorScheme="teal"
          onClick={() => handleExportData('clients', 'csv')}
          loading={isExportingData}
          loadingText="Exporting..."
        >
          Export Clients (CSV)
        </Button>
        <Button
          colorScheme="teal"
          onClick={() => handleExportData('workers', 'csv')}
          loading={isExportingData}
          loadingText="Exporting..."
        >
          Export Workers (CSV)
        </Button>
        <Button
          colorScheme="teal"
          onClick={() => handleExportData('tasks', 'csv')}
          loading={isExportingData}
          loadingText="Exporting..."
        >
          Export Tasks (CSV)
        </Button>
        <Button
          colorScheme="purple"
          onClick={handleExportRules}
          loading={isExportingRules}
          loadingText="Exporting..."
        >
          Export Rules Config (JSON)
        </Button>
      </HStack>
    </Box>
  );
};

export default ExportSection;
