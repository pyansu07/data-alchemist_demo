'use client';
import { useState } from 'react';
import {
    Box, Button, IconButton, Input, VStack, Text, Spinner,
    useDisclosure, HStack
} from '@chakra-ui/react';
import { FiMessageCircle, FiX } from 'react-icons/fi';
import { useDataStore } from '../store/dataStore';
import { EntityType } from '../types';

interface Message {
    id: string;
    sender: 'user' | 'ai';
    text: string;
    type?: 'recommendation' | 'simulation' | 'readiness_score' | 'data_modification_action' | 'error_action';
    data?: Record<string, unknown>;
}

// 1. Naya prop add karein
interface AICoPilotPanelProps {
    onDataModified: (entityType: EntityType) => void;
}

export const AICoPilotPanel = ({ onDataModified }: AICoPilotPanelProps) => {
    // ... (maujooda states waise hi rahenge)
    const { open, onToggle } = useDisclosure({ defaultOpen: true });
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', sender: 'ai', text: 'Hello! I am your AI Co-Pilot. How can I help you strategize your data today?' }
    ]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { clients, workers, tasks, rules, priorities, applyDataModification } = useDataStore();
    const [pendingAction, setPendingAction] = useState<Record<string, unknown> | null>(null);

    const handleSendMessage = async () => {
        // ... (API call logic waisa hi rahega)
        if (!userInput.trim() || isLoading) return;

        const newUserMessage: Message = { id: Date.now().toString(), sender: 'user', text: userInput };
        setMessages(prev => [...prev, newUserMessage]);
        setUserInput('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/ai/copilot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userInput: userInput,
                    chatHistory: messages,
                    fullDataContext: { clients, workers, tasks, rules, priorities },
                }),
            });

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }

            const aiResponse: Message = await response.json();

            if (aiResponse.type === 'data_modification_action' && aiResponse.data) {
                setPendingAction(aiResponse.data);
            }

            setMessages(prev => [...prev, aiResponse]);

        } catch (error) {
            console.error("Failed to send message to Co-Pilot:", error);
            const errorMessage: Message = {
                id: Date.now().toString(),
                sender: 'ai',
                text: 'Sorry, I am having trouble connecting to my brain. Please try again later.'
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApplyAction = () => {
        if (pendingAction) {
            applyDataModification(pendingAction);
            
            // Parent component ko batayein ki data modify hua hai
            // Pehle check karein ki function maujood hai
            if (onDataModified && typeof onDataModified === 'function') {
                if (pendingAction.entity && typeof pendingAction.entity === 'string') {
                    onDataModified(pendingAction.entity as EntityType);
                }
            } else {
                console.warn("onDataModified prop was not provided to AICoPilotPanel.");
            }

            setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'ai', text: 'Action applied successfully!' }]);
            setPendingAction(null);
        }
    };

    const handleDiscardAction = () => {
        setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'ai', text: 'Action discarded.' }]);
        setPendingAction(null);
    };

    const renderMessageContent = (msg: Message) => {
        if (msg.type === 'data_modification_action' && msg.data && msg.data === pendingAction) {
            return (
                <VStack align="start" gap={3}>
                    <Text>{msg.text}</Text>
                    <Box p={2} bg="gray.200" rounded="md" maxH="150px" overflowY="auto" fontSize="xs" w="full" whiteSpace="pre-wrap">
                        {JSON.stringify(pendingAction, null, 2)}
                    </Box>
                    <HStack mt={2}>
                        <Button colorScheme="green" size="sm" onClick={handleApplyAction}>
                            Apply Change
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDiscardAction}>
                            Discard
                        </Button>
                    </HStack>
                </VStack>
            );
        }
        return <Text>{msg.text}</Text>;
    };

    // ... (baaki ka component waisa hi rahega)
    return (
        <>
            {open && (
                <Box
                    p={4}
                    color="black"
                    mt={4}
                    bg="white"
                    rounded="lg"
                    shadow="lg"
                    w={{ base: '100%', md: '400px' }}
                    position="fixed"
                    bottom="20px"
                    right={{ base: '0', md: '20px' }}
                    h="500px"
                    display="flex"
                    flexDirection="column"
                    zIndex={10}
                >
                    <HStack justifyContent="space-between" mb={4}>
                        <Text fontSize="xl" fontWeight="bold">AI Co-Pilot</Text>
                        <IconButton aria-label="Close Co-Pilot" size="sm" onClick={onToggle}>
                            <FiX />
                        </IconButton>
                    </HStack>

                    <VStack flex="1" overflowY="auto" align="stretch" gap={4} pr={2}>
                        {messages.map((msg) => (
                            <Box
                                key={msg.id}
                                bg={msg.sender === 'ai' ? 'gray.100' : 'blue.100'}
                                p={3}
                                rounded="lg"
                                alignSelf={msg.sender === 'ai' ? 'flex-start' : 'flex-end'}
                                maxW="80%"
                            >
                                {renderMessageContent(msg)}
                            </Box>
                        ))}
                        {isLoading && <Spinner alignSelf="flex-start" />}
                    </VStack>

                    <HStack mt={4}>
                        <Input
                            placeholder="Ask me to modify data or give advice..."
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <Button onClick={handleSendMessage} colorScheme="blue">Send</Button>
                    </HStack>
                </Box>
            )}

            {!open && (
                <IconButton
                    aria-label="Open Co-Pilot"
                    size="lg"
                    colorScheme="blue"
                    position="fixed"
                    bottom="20px"
                    right="20px"
                    onClick={onToggle}
                    borderRadius="full"
                    shadow="lg"
                >
                    <FiMessageCircle />
                </IconButton>
            )}
        </>
    );
};
