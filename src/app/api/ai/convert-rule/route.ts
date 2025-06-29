// app/api/ai/convert-rule/route.ts
import { NextResponse } from 'next/server';
// 1. OpenAI ke bajaye GoogleGenerativeAI import karein
import { GoogleGenerativeAI } from '@google/generative-ai';

// 2. Gemini client aur model ko initialize karein
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

export async function POST(req: Request) {
  try {
    const { ruleDescription, availableRuleTypes, allTaskIds, allWorkerGroups } = await req.json();

    if (!ruleDescription) {
      return NextResponse.json({ error: 'Missing rule description' }, { status: 400 });
    }
    
    if (!process.env.GEMINI_API_KEY) {
      // Yeh check karega ki key load hui hai ya nahi
      throw new Error('Gemini API key not found in environment variables.');
    }

    const ruleTypeSchemas = `
      interface CoRunRule { type: 'coRun', tasks: string[] }
      interface LoadLimitRule { type: 'loadLimit', workerGroup: string, maxSlotsPerPhase: number }
      interface PhaseWindowRule { type: 'phaseWindow', taskID: string, allowedPhases: number[] }
    `;

    const availableContext = `
      Available Task IDs: [${allTaskIds.join(', ')}]
      Available Worker Groups: [${allWorkerGroups.join(', ')}]
    `;

    // 3. Gemini ke liye prompt design karein
    const prompt = `You are a rule converter. Convert the user's natural language rule description into a JSON object that strictly adheres to one of the provided TypeScript interfaces.

If the rule cannot be clearly mapped, return an empty JSON object {}.
Ensure that any IDs (like TaskID, WorkerGroup) referenced in the rule exist in the provided context if applicable.

Available Rule Types (TypeScript Interfaces):
${ruleTypeSchemas}

${availableContext}

User Rule Description: "${ruleDescription}"

Strictly return ONLY the JSON object. Do not add any extra text or markdown formatting like \`\`\`json.
JSON Rule:`;

    // 4. Gemini ko call karein
    const result = await model.generateContent(prompt);
    const response = result.response;
    const jsonString = response.text(); // 5. Response se text nikalein

    if (!jsonString) {
      return NextResponse.json({ error: 'AI did not return a valid rule object.' }, { status: 500 });
    }

    const convertedRule = JSON.parse(jsonString);

    // Basic validation of the AI's output
    if (!convertedRule || !convertedRule.type || !availableRuleTypes.includes(convertedRule.type)) {
      return NextResponse.json({ error: 'AI returned an unmappable or invalid rule format.' }, { status: 422 });
    }

    return NextResponse.json(convertedRule);

  } catch (error: unknown) {
    console.error('AI Rule Conversion API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: 'Failed to process AI rule conversion request.', details: errorMessage }, { status: 500 });
  }
}
