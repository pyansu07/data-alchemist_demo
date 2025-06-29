// components/ValidationSummary.tsx
'use client';
import { Box, Text, Badge, VStack } from '@chakra-ui/react';
import { useDataStore } from '../store/dataStore';

const ValidationSummary = () => {
  const { validationErrors } = useDataStore();

  const errorCount = validationErrors.length;
  const errorDetails = validationErrors.reduce((acc, err) => {
    const key = `${err.severity}s`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(err);
    return acc;
  }, {} as Record<string, typeof validationErrors>);

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" mt={4}>
      <Text fontSize="xl" mb={4}>Validation Summary</Text>
      {errorCount === 0 ? (
        <Text color="green.500">All data looks good! No errors found.</Text>
      ) : (
        <>
          <Text mb={2}>
            Total Errors/Warnings: <Badge colorScheme="red">{errorCount}</Badge>
          </Text>
          <VStack gap={2} align="stretch">
            {Object.entries(errorDetails).map(([type, errors]) => (
              <Box key={type} borderWidth="1px" borderRadius="md" p={3}>
                <Text fontWeight="bold" mb={2}>
                  {type.charAt(0).toUpperCase() + type.slice(1)} ({errors.length})
                </Text>
                <VStack gap={2} align="stretch">
                  {errors.map((err, index) => (
                    <Text key={index} fontSize="sm" color={err.severity === 'error' ? 'red.600' : 'orange.600'}>
                      **ID:** {err.id} {err.field && ` | **Field:** ${err.field}`} | **Message:** {err.message}
                    </Text>
                  ))}
                </VStack>
              </Box>
            ))}
          </VStack>
        </>
      )}
    </Box>
  );
};

export default ValidationSummary;
