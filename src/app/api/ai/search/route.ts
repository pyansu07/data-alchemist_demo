// app/api/ai/search/route.ts
import { NextResponse } from 'next/server';
// OpenAI ke bajaye GoogleGenerativeAI import karein
import { GoogleGenerativeAI } from '@google/generative-ai';

// Google Gemini client initialize karein
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' }); // Ya "gemini-1.5-flash" jaise model use karein

export async function POST(req: Request) {
  try {
    const { query, entityType, dataSchema } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      // Yeh check karega ki key load hui hai ya nahi
      throw new Error('Gemini API key not found in environment variables.');
    }

    if (!query || !entityType || !dataSchema) {
      return NextResponse.json({ error: 'Missing query, entityType, or dataSchema' }, { status: 400 });
    }

    // Gemini ke liye prompt design karein
    const prompt = `You are a data filtering assistant. Convert the user's natural language query into a JSON object with an array of filters. Each filter object must have 'field', 'operator', and 'value'.

    Data Schema for ${entityType}:
    ${dataSchema}

    Examples:
    Query: "tasks with Duration greater than 5"
    Response: {"filters": [{"field": "Duration", "operator": ">", "value": 5}]}
    Query: "clients whose PriorityLevel is 3 and RequestedTaskIDs include 'T001'"
    Response: {"filters": [{"field": "PriorityLevel", "operator": "=", "value": 3}, {"field": "RequestedTaskIDs", "operator": "includes", "value": "T001"}]}

    User's Query: "${query}"

    Strictly return ONLY the JSON object. Do not add any extra text or markdown formatting like \`\`\`json.`;

    // Gemini ko call karein
    const result = await model.generateContent(prompt);
    const response = result.response;
    const jsonString = response.text();

    if (!jsonString) {
      throw new Error('AI did not return any content.');
    }
    
    // AI se mile response ko parse karein
    const { filters } = JSON.parse(jsonString);

    return NextResponse.json({ filters });

  } catch (error: unknown) {
    // Error ko terminal mein log karein taaki aap asli galti dekh sakein
    console.error('[AI SEARCH API ERROR]', error);
    
    // Frontend ko ek saaf error message bhejें
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: 'Failed to process AI search request.', details: errorMessage }, { status: 500 });
  }
}
