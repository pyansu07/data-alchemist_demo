// app/api/ai/copilot/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// 1. Sabhi zaroori handlers ko import karein
import { handleRuleRecommendation } from './handlers/ruleRecommendation';
import { handleDataModification } from './handlers/dataModification';
import { handleWhatIfSimulation } from './handlers/whatIfSimulation';
// Assume the readinessCheck handler will be created later
import { handleReadinessCheck } from './handlers/readinessCheck';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

function extractJsonFromMarkdown(text: string): string {
  // Regex to find JSON inside ``````
  const match = text.match(/``````/);
  if (match && match[1]) {
    return match[1];
  }
  return text;
}

async function classifyIntent(userInput: string) {
  const prompt = `You are an intent classifier for a data management tool. Classify the user's latest message into one of the following categories:
  - "data_modification": User wants to change, add, or delete data (e.g., "Set all GroupA workers' load to 3", "Delete task T99").
  - "what_if_simulation": User is asking about the impact of a potential change (e.g., "What happens if I add a rule for T1 and T2 to co-run?").
  - "request_recommendation": User is explicitly asking for advice (e.g., "Any suggestions for my rules?", "Find risks in my data").
  - "readiness_check": User wants a final summary or score (e.g., "Is my data ready to export?", "Give me a sanity check").
  - "general_query": A general question or conversation.

  User's message: "${userInput}"
  
  Strictly return ONLY the raw JSON object itself, without any markdown formatting, explanations, or enclosing characters like \`\`\`json.
  Example: {"intent": "data_modification"}`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const rawText = response.text();

  const jsonString = extractJsonFromMarkdown(rawText);

  try {
    return JSON.parse(jsonString);
  } catch (parseError) {
    console.error("JSON Parse Error after cleaning:", parseError);
    console.error("Cleaned string that failed to parse:", jsonString);
    return { intent: "general_query" };
  }
}

export async function POST(req: Request) {
  try {
    const { userInput, fullDataContext } = await req.json();

    if (!userInput || !fullDataContext) {
      return NextResponse.json({ error: 'Missing userInput or fullDataContext' }, { status: 400 });
    }

    const { intent } = await classifyIntent(userInput);

    // 2. Switch statement ko update karein
    switch (intent) {
      case 'data_modification':
        return await handleDataModification(userInput, fullDataContext);

      case 'what_if_simulation':
        return await handleWhatIfSimulation(userInput, fullDataContext);

      case 'request_recommendation':
        return await handleRuleRecommendation(fullDataContext);

      case 'readiness_check':
        return await handleReadinessCheck(fullDataContext);

      default:
        return NextResponse.json({ id: Date.now().toString(), sender: 'ai', text: 'I can help with data modifications, rule advice, simulations, and readiness checks. Please be more specific.' });
    }
  } catch (error: unknown) {
    console.error('AI Copilot API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: 'Failed to process AI copilot request.', details: errorMessage }, { status: 500 });
  }
}
