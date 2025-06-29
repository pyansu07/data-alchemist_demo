// app/api/ai/copilot/handlers/readinessCheck.ts
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { runValidations } from '../../../../../lib/validators';
import { ParsedClient, ParsedWorker, ParsedTask } from '../../../../../types/index';

export async function handleReadinessCheck(fullDataContext: { clients: ParsedClient[]; workers: ParsedWorker[]; tasks: ParsedTask[] }) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

    // 1. Run validations and calculate readiness score
    const validationErrors = runValidations(fullDataContext);
    let score = 100 - (validationErrors.length * 5);
    score = Math.max(0, Math.min(100, score));

    // 2. Prepare error summaries for AI
    const errorSummaries = validationErrors.slice(0, 5).map(e =>
        `• [${e.severity?.toUpperCase() || 'ERROR'}] ${e.id ? `ID: ${e.id} | ` : ''}${e.field ? `Field: ${e.field} | ` : ''}${e.message}`
    ).join('\n') || 'None';

    // 3. Compose prompt for Gemini
    const prompt = `
This is a resource allocation configuration for a business. Based on the summary below, provide:
- A short "✅ Good Things" list (what is working well)
- A short "⚠️ Areas for Improvement" list (what needs fixing)
- Keep it concise and bullet-pointed.

Configuration Summary:
- Readiness Score: ${score}/100
- Validation Errors: ${validationErrors.length}
- Top Errors:
${errorSummaries}

Respond in this format:
✅ Good Things:
- ...
- ...
⚠️ Areas for Improvement:
- ...
- ...
    `.trim();

    // 4. Get AI analysis
    const result = await model.generateContent(prompt);
    const analysisText = result.response.text();

    // 5. Return final response
    return NextResponse.json({
        id: Date.now().toString(),
        sender: 'ai',
        text: `Your configuration is ready for export!\n\n**Readiness Score: ${score}/100**\n\n${analysisText}`,
        type: 'readiness_score'
    });
}
