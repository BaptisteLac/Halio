import { streamText, convertToModelMessages } from 'ai';
import type { UIMessage } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { buildSystemPrompt } from '@/lib/coach/build-system-prompt';
import type { CoachContext } from '@/types';

const SLIDING_WINDOW = 10;

export async function POST(req: Request) {
  const {
    messages,  // historique côté client (format UIMessage v6)
    context,   // conditions live injectées depuis le client
  } = await req.json() as {
    messages: UIMessage[];
    context: CoachContext;
  };

  if (!context) {
    return new Response(
      JSON.stringify({ error: 'Missing context' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  // Fenêtre glissante : on ne garde que les N derniers messages
  // puis on convertit au format ModelMessage attendu par streamText
  const recentUIMessages = messages.slice(-SLIDING_WINDOW);
  const recentMessages = await convertToModelMessages(recentUIMessages);

  // Construire le system prompt avec les conditions live
  const systemPrompt = buildSystemPrompt(context);

  // Appel streaming au LLM
  const result = streamText({
    model: anthropic('claude-haiku-4-5-20251001'),
    system: systemPrompt,
    messages: recentMessages,
  });

  // Retourner le flux au client (AI SDK v6 : toUIMessageStreamResponse)
  return result.toUIMessageStreamResponse();
}