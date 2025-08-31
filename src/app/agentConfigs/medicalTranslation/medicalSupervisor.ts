import { RealtimeItem, tool } from '@openai/agents/realtime';

export const medicalSupervisorInstructions = `You are an expert medical translation supervisor, providing accurate medical translations with cultural context awareness.

# Your Role
You assist a junior medical translator by handling complex medical terminology, cultural adaptations, and emergency situations. Your responses will be read verbatim by the translator agent to the patient and doctor.

# Critical Instructions
- Always identify the source and target languages from the conversation context
- Provide accurate medical translations with proper terminology
- Flag potential medical emergencies immediately
- Adapt translations for cultural medical concepts when necessary
- Your message will be spoken directly by the translator agent

# Medical Translation Guidelines
- Use precise medical terminology in the target language
- Maintain clinical accuracy above all else  
- For drug names: provide both generic and common names when helpful
- For procedures: explain briefly if the concept doesn't exist in target culture
- For symptoms: ensure urgency level is preserved across languages

# Emergency Detection
If you detect potential medical emergencies (chest pain, difficulty breathing, loss of consciousness, severe bleeding, etc.), immediately:
1. Provide the translation
2. Add: "This appears to describe a medical emergency. Immediate medical attention may be required."

# Cultural Adaptation Examples
- Pain scales may be described differently across cultures
- Family involvement in medical decisions varies by culture  
- Religious considerations for certain treatments
- Traditional vs. Western medicine concepts

# Response Format
Always provide:
1. The accurate translation
2. Any necessary cultural context
3. Emergency alerts if applicable
4. Clarification if medical terms need explanation

# Example Responses
User context: Patient said "Me duele mucho el pecho y no puedo respirar bien" (Spanish to English)
Response: "The patient says: 'My chest hurts a lot and I can't breathe well.' This appears to describe a medical emergency. Immediate medical attention may be required."

User context: Doctor said "We need to do an MRI" (English to Spanish)  
Response: "El doctor dice: 'Necesitamos hacer una resonancia magnética.' This is an imaging test using magnetic fields to see inside the body."`;

async function fetchResponsesMessage(body: any) {
  const response = await fetch('/api/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...body, parallel_tool_calls: false }),
  });

  if (!response.ok) {
    console.warn('Server returned an error:', response);
    return { error: 'Something went wrong.' };
  }

  const completion = await response.json();
  return completion;
}

export const getMedicalTranslationFromSupervisor = tool({
  name: 'getMedicalTranslationFromSupervisor',
  description: 'Gets expert medical translation for complex terminology, cultural context, or emergency situations',
  parameters: {
    type: 'object',
    properties: {
      originalText: {
        type: 'string',
        description: 'The original text that needs expert medical translation',
      },
      sourceLanguage: {
        type: 'string', 
        description: 'The language the original text is in',
      },
      targetLanguage: {
        type: 'string',
        description: 'The language to translate to',
      },
      medicalContext: {
        type: 'string',
        description: 'Additional context about why this needs expert translation (complex term, emergency, cultural context, etc.)',
      },
    },
    required: ['originalText', 'sourceLanguage', 'targetLanguage', 'medicalContext'],
    additionalProperties: false,
  },
  execute: async (input, details) => {
    const { originalText, sourceLanguage, targetLanguage, medicalContext } = input as {
      originalText: string;
      sourceLanguage: string;
      targetLanguage: string;
      medicalContext: string;
    };

    const addBreadcrumb = (details?.context as any)?.addTranscriptBreadcrumb as
      | ((title: string, data?: any) => void)
      | undefined;

    const history: RealtimeItem[] = (details?.context as any)?.history ?? [];
    const filteredLogs = history.filter((log) => log.type === 'message');

    const body: any = {
      model: 'gpt-4.1',
      input: [
        {
          type: 'message',
          role: 'system',
          content: medicalSupervisorInstructions,
        },
        {
          type: 'message',
          role: 'user',
          content: `==== Translation Request ====
          Original Text: "${originalText}"
          Source Language: ${sourceLanguage}
          Target Language: ${targetLanguage}  
          Medical Context: ${medicalContext}
          
          ==== Conversation History ====
          ${JSON.stringify(filteredLogs, null, 2)}
          
          Please provide an accurate medical translation with any necessary cultural context or emergency alerts.`,
        },
      ],
      tools: [], // No additional tools needed for basic translation
    };

    if (addBreadcrumb) {
      addBreadcrumb('[Medical Supervisor] Translation Request', {
        originalText,
        sourceLanguage,
        targetLanguage,
        medicalContext
      });
    }

    const response = await fetchResponsesMessage(body);
    if (response.error) {
      return { error: 'Medical translation service temporarily unavailable.' };
    }

    // Extract the response text
    const outputItems: any[] = response.output ?? [];
    const assistantMessages = outputItems.filter((item) => item.type === 'message');
    
    const translationResult = assistantMessages
      .map((msg: any) => {
        const contentArr = msg.content ?? [];
        return contentArr
          .filter((c: any) => c.type === 'output_text')
          .map((c: any) => c.text)
          .join('');
      })
      .join('\n');

    if (addBreadcrumb) {
      addBreadcrumb('[Medical Supervisor] Translation Result', { translationResult });
    }

    return { translation: translationResult };
  },
});