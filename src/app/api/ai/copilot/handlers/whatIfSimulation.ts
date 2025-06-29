// app/api/ai/copilot/handlers/whatIfSimulation.ts
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ParsedClient, ParsedWorker, ParsedTask, BusinessRule } from '../../../../../types/index';

export async function handleWhatIfSimulation(userInput: string, fullDataContext: { clients: ParsedClient[]; workers: ParsedWorker[]; tasks: ParsedTask[]; rules: BusinessRule[] }) {
  const { clients, workers, tasks, rules } = fullDataContext;

  // AI client aur model ko initialize karein
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

  // AI ko behtar context dene ke liye data ka summary banayein
  const dataSummary = `
    - Total Clients: ${clients.length} (High-priority clients: ${clients.filter((c) => c.PriorityLevel === 1).length})
    - Total Workers: ${workers.length}
    - Total Tasks: ${tasks.length}
    - Current Rules: ${rules.length}
    - Key worker skills available: ${[...new Set(workers.flatMap((w) => w.Skills))].slice(0, 10).join(', ')}
  `;

  // AI ko nirdesh dene ke liye ek vistarit (detailed) prompt
  const prompt = `You are a strategic data simulation assistant. Your job is to analyze the potential impact and risks of a user's hypothetical request based on a summary of the current data.

  Data Summary:
  ${dataSummary}

  User's "What If" Request:
  "${userInput}"

  Your Task:
  1.  Acknowledge the user's scenario.
  2.  Analyze the primary (direct) and secondary (indirect) effects.
  3.  Identify potential risks, such as resource bottlenecks, conflicts with existing rules, or negative impacts on high-priority clients.
  4.  Provide a concise, clear, and actionable analysis. Start with a clear conclusion (e.g., "This seems risky because...").

  Example Analysis:
  "Simulating this scenario... Assigning Task T49 only to Phase 5 could be risky. While it frees up workers in earlier phases, it creates a major bottleneck in Phase 5 for 'devops' skills and could delay the project for Client C9, who has a high priority level."`;

  try {
    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text();

    return NextResponse.json({
      id: Date.now().toString(),
      sender: 'ai',
      text: aiResponse,
      type: 'simulation'
    });
  } catch (error) {
    console.error('What-If Simulation Handler Error:', error);
    return NextResponse.json({
      id: Date.now().toString(),
      sender: 'ai',
      text: "I'm sorry, I couldn't perform the simulation at this moment. Please try rephrasing your question or try again later.",
      type: 'error_action'
    });
  }
}
