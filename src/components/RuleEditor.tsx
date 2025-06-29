// components/RuleEditor.tsx
'use client';
import { useState, useMemo } from 'react';
import {
  Box,
  Button,
  Input,
  Text,
  VStack,
  HStack,
  IconButton,
  CloseButton,
  Spinner,
} from '@chakra-ui/react';
import { toaster } from '../components/ui/toaster';
import { FaTrash } from 'react-icons/fa';
import { useDataStore } from '../store/dataStore';
import { BusinessRule, CoRunRule, LoadLimitRule, PhaseWindowRule } from '../types';

const ruleTypes = [
  { label: 'Co-run Tasks', value: 'coRun' },
  { label: 'Load Limit for Workers', value: 'loadLimit' },
  { label: 'Phase Window for Task', value: 'phaseWindow' },
  // Add more as per document [1]
];

const RuleEditor = () => {
  const { rules, addRule, removeRule, tasks, workers } = useDataStore();
  const [selectedRuleType, setSelectedRuleType] = useState<string>('');
  const [nlRuleInput, setNlRuleInput] = useState('');
  const [isLoadingAiConversion, setIsLoadingAiConversion] = useState(false);

  // Form states for different rule types
  const [coRunTasks, setCoRunTasks] = useState<string[]>([]);
  const [loadLimitWorkerGroup, setLoadLimitWorkerGroup] = useState('');
  const [loadLimitMaxSlots, setLoadLimitMaxSlots] = useState<number>(0);
  const [phaseWindowTaskId, setPhaseWindowTaskId] = useState('');
  const [phaseWindowAllowedPhases, setPhaseWindowAllowedPhases] = useState<string>(''); // comma-separated string for input

  const allTaskIds = useMemo(() => tasks.map(t => t.TaskID), [tasks]);
  const allWorkerGroups = useMemo(() => {
    const groups = new Set<string>();
    workers.forEach(w => w.WorkerGroup && groups.add(w.WorkerGroup));
    return Array.from(groups);
  }, [workers]);

  const resetForm = () => {
    setCoRunTasks([]);
    setLoadLimitWorkerGroup('');
    setLoadLimitMaxSlots(0);
    setPhaseWindowTaskId('');
    setPhaseWindowAllowedPhases('');
    setNlRuleInput('');
    setSelectedRuleType('');
  };

  const handleAddRule = () => {
    let newRule: BusinessRule | null = null;
    try {
      if (selectedRuleType === 'coRun') {
        if (coRunTasks.length < 2) throw new Error('Co-run rule requires at least two tasks.');
        newRule = { type: 'coRun', tasks: coRunTasks };
      } else if (selectedRuleType === 'loadLimit') {
        if (!loadLimitWorkerGroup) throw new Error('Load Limit requires a Worker Group.');
        if (isNaN(loadLimitMaxSlots) || loadLimitMaxSlots <= 0) throw new Error('Max Slots Per Phase must be a positive number.');
        newRule = { type: 'loadLimit', workerGroup: loadLimitWorkerGroup, maxSlotsPerPhase: loadLimitMaxSlots };
      } else if (selectedRuleType === 'phaseWindow') {
        const parsedPhases = phaseWindowAllowedPhases.split(',').map(Number).filter(n => !isNaN(n) && n > 0);
        if (!phaseWindowTaskId) throw new Error('Phase Window requires a Task ID.');
        if (parsedPhases.length === 0) throw new Error('Allowed Phases must be a comma-separated list of numbers.');
        newRule = { type: 'phaseWindow', taskID: phaseWindowTaskId, allowedPhases: parsedPhases };
      }

      if (newRule) {
        addRule(newRule);
        toaster.create({
          title: 'Rule Added',
          description: 'New rule has been successfully added.',
          type: 'success',
        });
        resetForm();
      }
    } catch (error: unknown) {
      toaster.create({
        title: 'Error Adding Rule',
        description: error instanceof Error ? error.message : 'Unknown error',
        type: 'error',
      });
    }
  };

  const handleNlToRuleConversion = async () => {
    if (!nlRuleInput.trim()) {
      toaster.create({ title: 'Input Needed', description: 'Please enter a rule description.', type: 'warning' });
      return;
    }
    setIsLoadingAiConversion(true);
    try {
      const response = await fetch('/api/ai/convert-rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleDescription: nlRuleInput,
          availableRuleTypes: ruleTypes.map(rt => rt.value),
          allTaskIds: Array.from(allTaskIds),
          allWorkerGroups: Array.from(allWorkerGroups),
          // Optionally send current data for more context-aware rule suggestions/validation
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to convert natural language to rule.');
      }

      const convertedRule: BusinessRule = await response.json();

      if (convertedRule && convertedRule.type) {
        setSelectedRuleType(convertedRule.type);
        // Pre-fill form based on converted rule type
        if (convertedRule.type === 'coRun') {
          setCoRunTasks((convertedRule as CoRunRule).tasks || []);
        } else if (convertedRule.type === 'loadLimit') {
          setLoadLimitWorkerGroup((convertedRule as LoadLimitRule).workerGroup || '');
          setLoadLimitMaxSlots((convertedRule as LoadLimitRule).maxSlotsPerPhase || 0);
        } else if (convertedRule.type === 'phaseWindow') {
          setPhaseWindowTaskId((convertedRule as PhaseWindowRule).taskID || '');
          setPhaseWindowAllowedPhases((convertedRule as PhaseWindowRule).allowedPhases?.join(', ') || '');
        }
        toaster.create({
          title: 'Conversion Successful',
          description: `Rule converted to type: ${convertedRule.type}. Review and Add.`,
          type: 'success',
        });
      } else {
        toaster.create({
          title: 'Conversion Failed',
          description: 'AI could not convert your description to a known rule format. Try rephrasing.',
          type: 'warning',
        });
      }
    } catch (error: unknown) {
      console.error('Rule conversion error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toaster.create({
        title: 'AI Conversion Error',
        description: errorMessage,
        type: 'error',
      });
    } finally {
      setIsLoadingAiConversion(false);
    }
  };

  const renderRuleForm = () => {
    switch (selectedRuleType) {
      case 'coRun':
        return (
          <VStack align="stretch">
            <Text fontWeight="bold">Tasks to Co-run (select from available Task IDs):</Text>
            <select
              value=""
              onChange={(e) => {
                const taskId = e.target.value;
                if (taskId && !coRunTasks.includes(taskId)) {
                  setCoRunTasks([...coRunTasks, taskId]);
                }
              }}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="">Select tasks</option>
              {allTaskIds.map((id) => (
                <option key={id} value={id} disabled={coRunTasks.includes(id)}>
                  {id}
                </option>
              ))}
            </select>
            <HStack wrap="wrap">
              {coRunTasks.map((task, index) => (
                <Box
                  key={index}
                  bg="blue.100"
                  color="blue.800"
                  px={2}
                  py={1}
                  borderRadius="md"
                  display="flex"
                  alignItems="center"
                  gap={1}
                >
                  {task}
                  <CloseButton
                    size="sm"
                    onClick={() => setCoRunTasks(coRunTasks.filter(t => t !== task))}
                  />
                </Box>
              ))}
            </HStack>
          </VStack>
        );
      case 'loadLimit':
        return (
          <VStack align="stretch">
            <Text fontWeight="bold">Worker Group:</Text>
            <select
              value={loadLimitWorkerGroup}
              onChange={(e) => setLoadLimitWorkerGroup(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="">Select Worker Group</option>
              {allWorkerGroups.map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
            <Text fontWeight="bold" mt={2}>Max Slots Per Phase:</Text>
            <Input
              type="number"
              value={loadLimitMaxSlots}
              onChange={(e) => setLoadLimitMaxSlots(Number(e.target.value))}
              placeholder="e.g., 5"
            />
          </VStack>
        );
      case 'phaseWindow':
        return (
          <VStack align="stretch">
            <Text fontWeight="bold">Task ID:</Text>
            <select
              value={phaseWindowTaskId}
              onChange={(e) => setPhaseWindowTaskId(e.target.value)}
              style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
              <option value="">Select Task ID</option>
              {allTaskIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
            <Text fontWeight="bold" mt={2}>Allowed Phases (comma-separated, e.g., 1,3,5 or 1-3):</Text>
            <Input
              value={phaseWindowAllowedPhases}
              onChange={(e) => setPhaseWindowAllowedPhases(e.target.value)}
              placeholder="e.g., 1,3,5 or 2-4"
            />
          </VStack>
        );
      default:
        return <Text color="gray.500">Select a rule type or describe your rule in natural language.</Text>;
    }
  };

  const formatRuleForDisplay = (rule: BusinessRule) => {
    switch (rule.type) {
      case 'coRun':
        return `Co-run: Tasks [${rule.tasks.join(', ')}] must run together.`;
      case 'loadLimit':
        return `Load Limit: Worker Group "${rule.workerGroup}" has max ${rule.maxSlotsPerPhase} slots per phase.`;
      case 'phaseWindow':
        return `Phase Window: Task "${rule.taskID}" allowed in phases [${rule.allowedPhases.join(', ')}].`;
      default:
        return JSON.stringify(rule);
    }
  };

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg">
      <Text fontSize="xl" mb={4}>Define Business Rules</Text>

      <VStack gap={4} align="stretch">
        <Box>
          <Text mb={2} fontWeight="bold">Describe your rule in plain English (AI Powered):</Text>
          <HStack>
            <Input
              placeholder="e.g., 'Tasks T001 and T002 must always run together'"
              value={nlRuleInput}
              onChange={(e) => setNlRuleInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNlToRuleConversion();
              }}
            />
            <Button onClick={handleNlToRuleConversion} colorScheme="purple" loading={isLoadingAiConversion}>
              {isLoadingAiConversion ? <Spinner size="sm" /> : "Convert to Rule"}
            </Button>
          </HStack>
          <Text fontSize="sm" color="gray.500" mt={1}>
            AI will convert your description into a structured rule, which will pre-fill the form below.
          </Text>
        </Box>

        <Text fontSize="md" fontWeight="bold">--- OR ---</Text>

        <Box>
          <Text mb={2} fontWeight="bold">Select Rule Type:</Text>
          <select
            value={selectedRuleType}
            onChange={(e) => {
              setSelectedRuleType(e.target.value);
              // Reset form fields when type changes
              resetForm();
            }}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }}
          >
            <option value="">Choose a rule type</option>
            {ruleTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </Box>

        {selectedRuleType && (
          <Box p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
            {renderRuleForm()}
            <Button mt={4} colorScheme="green" onClick={handleAddRule} disabled={!selectedRuleType}>
              Add Rule
            </Button>
          </Box>
        )}

        <Text fontSize="xl" mt={8} mb={4}>Existing Rules</Text>
        {rules.length === 0 ? (
          <Text color="gray.500">No rules defined yet.</Text>
        ) : (
          <VStack align="stretch" gap={2} borderWidth="1px" borderRadius="md" p={4}>
            {rules.map((rule, index) => (
              <HStack key={index} justifyContent="space-between" p={2} borderWidth="1px" borderRadius="md">
                <Text>{formatRuleForDisplay(rule)}</Text>
                <HStack>
                  <IconButton
                    aria-label="Delete Rule"
                    size="sm"
                    colorScheme="red"
                    onClick={() => {
                      removeRule(index);
                      toaster.create({
                        title: 'Rule Deleted',
                        description: 'Rule removed successfully.',
                        type: 'info',
                      });
                    }}
                  >
                    <FaTrash />
                  </IconButton>
                </HStack>
              </HStack>
            ))}
          </VStack>
        )}
      </VStack>
    </Box>
  );
};

export default RuleEditor;
