// app/api/ai/copilot/handlers/ruleRecommendation.ts
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ParsedClient, ParsedWorker, ParsedTask, BusinessRule } from '../../../../../types/index';

// Yeh function data ko analyse karke salaah banata hai
export async function handleRuleRecommendation(fullDataContext: { clients: ParsedClient[]; workers: ParsedWorker[]; tasks: ParsedTask[]; rules: BusinessRule[] }) {
  const { clients, workers, tasks, rules } = fullDataContext;
  const recommendations: string[] = [];

  // --- Heuristic (Code-based) Checks ---
  // Yeh fast aur reliable checks hain jo AI ke bina bhi ho sakte hain

  // Check 1: Skill Coverage Risk (kya kisi task ke liye zaroori skill maujood hai?)
  const allWorkerSkills = new Set(workers.flatMap((w) => w.Skills.map((s: string) => s.toLowerCase().trim())));
  tasks.forEach((task) => {
    task.RequiredSkills.forEach((requiredSkill: string) => {
      if (!allWorkerSkills.has(requiredSkill.toLowerCase().trim())) {
        const message = `Risk Identified: Task '${task.TaskID} (${task.TaskName})' requires the skill "${requiredSkill}", which no worker has.`;
        // Duplicate messages ko add karne se bachein
        if (!recommendations.includes(message)) {
          recommendations.push(message);
        }
      }
    });
  });

  // --- AI-based Analysis ---
  // Ab hum AI se aur gehri (deeper) salaah maangenge

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

  const dataSummaryForAI = `
    - Total Clients: ${clients.length}
    - Total Workers: ${workers.length}
    - Total Tasks: ${tasks.length}
    - Current Rules: ${rules.length}
    - Critical Risks Found So Far: ${recommendations.length > 0 ? recommendations.join('; ') : 'None'}
  `;

  const prompt = `You are a data strategy advisor. Based on the following summary of a company's data, suggest ONE creative and high-impact new rule or action to improve efficiency or reduce risk. Frame it as a question to the user. Do not repeat the risks already found.

  Data Summary:
  ${dataSummaryForAI}
  
  Example Suggestion: "I notice many tasks in the 'QA' category. Would you like to set a load-limit for workers in 'GroupC' who mainly handle QA, to prevent burnout?"`;

  try {
    const result = await model.generateContent(prompt);
    const aiRecommendation = result.response.text();
    if (aiRecommendation) {
      recommendations.push(aiRecommendation);
    }
  } catch (aiError) {
    console.error("AI recommendation generation failed:", aiError);
    // Agar AI fail ho, toh bhi humara app crash nahi hoga, aur heuristic checks ka result dikhega
  }

  let finalText: string;
  if (recommendations.length > 0) {
    // Recommendations ko aasaan list mein format karein
    finalText = "Here are some recommendations based on your current setup:\n\n- " + recommendations.join('\n\n- ');
  } else {
    finalText = "Your data setup looks solid! I couldn't find any immediate risks or obvious rule recommendations. Great job!";
  }

  return NextResponse.json({
    id: Date.now().toString(),
    sender: 'ai',
    text: finalText,
    type: 'recommendation'
  });
}