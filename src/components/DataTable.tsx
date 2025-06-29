// components/DataTable.tsx
'use client';
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Input,
  Text,
} from '@chakra-ui/react';
import { toaster } from '../components/ui/toaster';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
  getFilteredRowModel,
  getSortedRowModel,
  CellContext,
  Table,
} from '@tanstack/react-table';
import { ParsedClient, ParsedWorker, ParsedTask, ValidationError, EntityType } from '../types';
import { runValidations } from '../lib/validators'; // Aage banayenge
import { useDataStore } from '../store/dataStore';

interface EditableCellProps<T> extends CellContext<T, unknown> {
  updateData: (rowIndex: number, columnId: string, value: unknown) => void;
  errors: ValidationError[];
}
const EditableCell = <T extends { [key: string]: unknown }>({
  getValue,
  row: { index },
  column: { id },
  table,
  updateData,
  errors,
}: EditableCellProps<T>) => {
  const initialValue = getValue();
  const [value, setValue] = useState(initialValue);

  const specificErrors = errors.filter(
    (err) => err.id === table.options.data[index][(table.options.meta as { idColumn?: string })?.idColumn as keyof T] && err.field === id
  );
  const hasError = specificErrors.length > 0;

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const onBlur = () => {
    if (value !== initialValue) {
      updateData(index, id, value);
      toaster.create({
        title: 'Data Updated',
        description: `Cell (${index}, ${id}) updated.`,
        type: 'info',
      });
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  // Convert complex types to displayable strings for editing
  const displayValue = useMemo(() => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    return String(value || '');
  }, [value]);

  return (
    <Input
      value={displayValue}
      onChange={(e) => setValue(e.target.value)}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      size="sm"
      variant="outline"
      color="gray.900"
      bg={hasError ? 'red.100' : 'white'}
      _placeholder={{ color: 'gray.700' }}
      borderColor={hasError ? 'red.400' : 'gray.200'}
      _focus={{ borderColor: hasError ? 'red.500' : 'blue.400', boxShadow: hasError ? '0 0 0 1px red' : '0 0 0 1px #3182ce' }}
    />
  );
};


interface DataTableProps<T extends Record<string, unknown>> {
  data: T[];
  columns: ColumnDef<T>[];
  entityType: EntityType;
}

const DataTable = <T extends { [key: string]: unknown }>({ data, columns, entityType }: DataTableProps<T>) => {
  const { clients, workers, tasks, setClients, setWorkers, setTasks, validationErrors, setValidationErrors } = useDataStore();

  const idColumnMap: Record<EntityType, string> = {
    clients: 'ClientID',
    workers: 'WorkerID',
    tasks: 'TaskID',
  };
  const idColumn = idColumnMap[entityType];

  const updateData = (rowIndex: number, columnId: string, value: unknown) => {
    const updatedData = [...data];
    let parsedValue = value;

    // Type conversion logic for specific fields
    if (columnId === 'PriorityLevel' || columnId === 'Duration' || columnId === 'MaxLoadPerPhase' || columnId === 'MaxConcurrent') {
      parsedValue = Number(value);
      if (isNaN(parsedValue as number)) parsedValue = 0; // Default to 0 or original value on invalid number
    } else if (columnId === 'RequestedTaskIDs' || columnId === 'Skills' || columnId === 'RequiredSkills') {
      parsedValue = String(value).split(',').map((s: string) => s.trim()).filter(Boolean);
    } else if (columnId === 'AvailableSlots' || columnId === 'PreferredPhases') {
      try {
        const parsed = JSON.parse(String(value));
        if (Array.isArray(parsed) && parsed.every(item => typeof item === 'number')) {
          parsedValue = parsed;
        } else {
          throw new Error('Not a valid JSON array of numbers');
        }
      } catch {
        parsedValue = String(value).split(',').map((n: string) => Number(n)).filter((n: number) => !isNaN(n));
      }
    } else if (columnId === 'AttributesJSON') {
      try {
        parsedValue = JSON.parse(String(value));
      } catch {
        parsedValue = {}; // Default to empty object on invalid JSON
      }
    }

    updatedData[rowIndex] = {
      ...updatedData[rowIndex],
      [columnId]: parsedValue,
    };

    // Update global store
    if (entityType === 'clients') setClients(updatedData as unknown as ParsedClient[]);
    else if (entityType === 'workers') setWorkers(updatedData as unknown as ParsedWorker[]);
    else if (entityType === 'tasks') setTasks(updatedData as unknown as ParsedTask[]);

    // Re-run validations
    const errors = runValidations({ clients, workers, tasks });
    setValidationErrors(errors);
  };

  const table = useReactTable({
    data,
    columns: columns.map(col => ({
      ...col,
      cell: (props: CellContext<T, unknown>) => (
        <EditableCell
          {...props}
          updateData={updateData}
          errors={validationErrors}
          table={table as Table<T>}
        />
      ),
    })),
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta: {
      idColumn: idColumn, // Pass the ID column name for error matching
    },
  });

  return (
    <Box overflowX="auto">
      {data.length === 0 ? (
        <Text textAlign="center" py={10} color="gray.500">
          No data loaded for {entityType}. Please upload a file.
        </Text>
      ) : (
        <Box as="table" width="100%" borderCollapse="collapse">
          <Box as="thead">
            {table.getHeaderGroups().map((headerGroup) => (
              <Box as="tr" key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <Box
                    as="th"
                    key={header.id}
                    p={2}
                    borderBottom="1px solid"
                    borderColor="gray.200"
                    textAlign="left"
                    fontWeight="bold"
                    css={{ colSpan: header.colSpan }}
                  >
                    {header.isPlaceholder ? null : (
                      <Box
                        {...{
                          className: header.column.getCanSort()
                            ? 'cursor-pointer select-none'
                            : '',
                        }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
          <Box as="tbody">
            {table.getRowModel().rows.map((row, rowIdx) => (
              <Box
                as="tr"
                key={row.id}
                bg={rowIdx % 2 === 0 ? 'gray.50' : 'white'}
              >
                {row.getVisibleCells().map((cell) => (
                  <Box as="td" key={cell.id} p={2} borderBottom="1px solid" borderColor="gray.100">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Box>
                ))}
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default DataTable;
