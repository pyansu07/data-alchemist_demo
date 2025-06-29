// app/api/ai/copilot/handlers/dataModification.ts
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Helper function jo markdown formatting se JSON nikaalega
function extractJsonFromMarkdown(text: string): string {
  const match = text.match(/``````/);
  if (match && match[1]) {
    return match[1];
  }
  return text;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function handleDataModification(userInput: string, _fullDataContext: unknown) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

  // AI ko data schema ke baare mein batayein taaki woh sahi field names use kare
  const dataSchemaContext = `
  Here are the data schemas for context. Ensure field names in 'filter' and 'changes' are correct.
  - clients: { ClientID, ClientName, PriorityLevel, RequestedTaskIDs, GroupTag, AttributesJSON }
  - workers: { WorkerID, WorkerName, Skills, AvailableSlots, MaxLoadPerPhase, WorkerGroup, QualificationLevel }
  - tasks: { TaskID, TaskName, Category, Duration, RequiredSkills, PreferredPhases, MaxConcurrent }
  `;

  const prompt = `You are a data modification bot. Convert the user's request into a JSON "action object".
  The action object must have:
  - "action": "update_many", "update_one", or "delete_one".
  - "entity": "clients", "workers", or "tasks".
  - "filter": an object to find the records to change (e.g., {"WorkerGroup": "GroupA"}).
  - "changes": an object with the new values (e.g., {"MaxLoadPerPhase": 3}). For "delete_one", this can be an empty object.

  ${dataSchemaContext}

  IMPORTANT: For fields that are numbers (like PriorityLevel, MaxLoadPerPhase, Duration), the value in the 'changes' object must be a number, not a string. For arrays (like Skills), create a string array.

  User request: "${userInput}"
  
  Strictly return ONLY the raw JSON object itself, without any markdown formatting.`;

  try {
    const result = await model.generateContent(prompt);
    const rawText = result.response.text();
    const actionJsonString = extractJsonFromMarkdown(rawText);

    const actionObject = JSON.parse(actionJsonString);

    // Backend action object return karega, frontend use apply karega
    return NextResponse.json({
      id: Date.now().toString(),
      sender: 'ai',
      text: `I have prepared the following action based on your request. Please review before applying.`,
      type: 'data_modification_action',
      data: actionObject // The executable action
    });
  } catch (error: unknown) {
    console.error('Data Modification Handler Error:', error);
    // User ko ek saaf error message bhejें
    return NextResponse.json({
      id: Date.now().toString(),
      sender: 'ai',
      text: "I'm sorry, I couldn't understand that modification request. Could you please try rephrasing it? For example: 'Set MaxLoadPerPhase to 3 for workers in GroupA'.",
      type: 'error_action'
    });
  }
}
