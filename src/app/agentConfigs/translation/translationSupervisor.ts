import { RealtimeItem, tool } from '@openai/agents/realtime';

export const translationSupervisorInstructions = `You are an expert translation engine maintaining perfect language pair tracking throughout the entire session.

# Your Mission
Provide accurate, high-quality translations while remembering the established language pair throughout the conversation.

# Language Pair Tracking
- Extract the language pair from conversation history (e.g., "Dutch and English", "Arabic and French")
- Remember: Language A ↔ Language B mapping for the entire session
- Never lose track of which language maps to which
- Use conversation context to determine source language if unclear

# Translation Protocol
- If input text is Language A → translate to Language B
- If input text is Language B → translate to Language A  
- Maintain original tone, formality level, and cultural context
- Preserve specialized terminology (medical, legal, technical, cultural terms)
- Keep natural flow and idiomatic expressions when possible

# Quality Standards
- Accuracy over literal word-for-word translation
- Natural sounding target language
- Culturally appropriate expressions
- Maintain speaker's intent and emotion
- Preserve technical precision for specialized content

# Response Format
CRITICAL: Provide ONLY the translated text. Nothing else.
- NO "The user said"
- NO explanations 
- NO commentary
- NO acknowledgments
- NO prefixes like "Translation:" or "ترجمة:"
- Just the pure translated text, period.

# Examples - EXACT FORMAT REQUIRED
If language pair is "Dutch ↔ English":
- Input: "Hoe gaat het met je?" → Output: "How are you doing?"
- Input: "I'm doing great, thanks!" → Output: "Het gaat geweldig, bedankt!"

If language pair is "Dutch ↔ Arabic":  
- Input: "Beste, hoe gaat het met jou?" → Output: "عزيزي، كيف حالك؟"
- Input: "عزيزي، كيف حالك؟" → Output: "Beste, hoe gaat het met jou?"

If language pair is "Arabic ↔ French":
- Input: "كيف حالك؟" → Output: "Comment ça va ?"  
- Input: "Ça va bien, merci" → Output: "بخير، شكراً"

# Anti-Drift Rules
- Never engage in conversation with the user
- Never ask questions back to the user  
- Never explain the translation process
- Never comment on the language or content
- Always translate to the opposite language of the input
- If unsure of input language, use conversation context and linguistic patterns to determine

# Language Detection
- Use linguistic patterns, script, and context clues
- Rely on conversation history to understand the established language pair
- If genuinely ambiguous, default to most likely language based on recent conversation flow

# Error Handling
- If text is unclear or garbled, provide best possible translation
- If text contains multiple languages, translate the primary language portion
- If text is not in either of the established languages, indicate this clearly: "Text appears to be in [detected language], not part of established [Language A] ↔ [Language B] pair"
`;

async function fetchResponsesMessage(body: any) {
  const response = await fetch('/api/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    // Force sequential execution for translation consistency
    body: JSON.stringify({ ...body, parallel_tool_calls: false }),
  });

  if (!response.ok) {
    console.warn('Translation server returned an error:', response);
    return { error: 'Translation service unavailable.' };
  }

  const completion = await response.json();
  return completion;
}

/**
 * Handles the translation response from GPT-4.1, extracting the final translated text
 */
async function handleResponse(
  response: any,
  addBreadcrumb?: (title: string, data?: any) => void,
) {
  if (response?.error) {
    return 'Translation service error. Please try again.';
  }

  const outputItems: any[] = response.output ?? [];
  
  // Get assistant messages containing the translation
  const assistantMessages = outputItems.filter((item) => item.type === 'message');

  const finalText = assistantMessages
    .map((msg: any) => {
      const contentArr = msg.content ?? [];
      return contentArr
        .filter((c: any) => c.type === 'output_text')
        .map((c: any) => c.text)
        .join('');
    })
    .join('\n')
    .trim();

  if (addBreadcrumb) {
    addBreadcrumb('[translationSupervisor] translation result', { translation: finalText });
  }

  return finalText || 'Unable to generate translation.';
}

export const getTranslationFromSupervisor = tool({
  name: 'getTranslationFromSupervisor', 
  description: 'Get accurate translation from expert GPT-4.1 translation engine with language pair tracking',
  parameters: {
    type: 'object',
    properties: {
      textToTranslate: {
        type: 'string',
        description: 'The exact text that needs to be translated between the established language pair',
      },
    },
    required: ['textToTranslate'],
    additionalProperties: false,
  },
  execute: async (input, details) => {
    const { textToTranslate } = input as { textToTranslate: string };

    const addBreadcrumb = (details?.context as any)?.addTranscriptBreadcrumb as
      | ((title: string, data?: any) => void)
      | undefined;

    const history: RealtimeItem[] = (details?.context as any)?.history ?? [];
    const filteredLogs = history.filter((log) => log.type === 'message');

    if (addBreadcrumb) {
      addBreadcrumb('[translationSupervisor] translation request', { 
        textToTranslate, 
        historyLength: filteredLogs.length 
      });
    }

    const body: any = {
      model: 'gpt-4.1', // Use GPT-4.1 for highest quality translation
      input: [
        {
          type: 'message',
          role: 'system', 
          content: translationSupervisorInstructions,
        },
        {
          type: 'message',
          role: 'user',
          content: `==== Conversation History ====
          ${JSON.stringify(filteredLogs, null, 2)}
          
          ==== Text to Translate ====
          ${textToTranslate}
          `,
        },
      ],
      tools: [], // No additional tools needed for translation
    };

    const response = await fetchResponsesMessage(body);
    
    // Extract translation from response
    const finalText = await handleResponse(response, addBreadcrumb);
    
    return { translation: finalText };
  },
});