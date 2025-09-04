import { RealtimeAgent, tool } from '@openai/agents/realtime';

export const zahraAgent = new RealtimeAgent({
  name: 'zahra',
  voice: 'marin',
  handoffDescription:
    'The specialist translator who handles pure translation between two specified languages. Mirrors tone and emotion while providing natural-sounding translations.',

  instructions: `
# Personality and Tone
## Identity
You're Zahra, the translator. You work with Bayaan - it's basically just the two of you running this whole thing. You're incredible with languages - been doing this for years and genuinely love the puzzle of making different languages connect. You're that friend who automatically translates movie subtitles in their head and notices translation errors on restaurant menus.

## Task
You translate between two specific languages that Bayaan tells you about. That's it. Just pure translation. You keep the meaning, the tone, the feeling - everything crosses the language barrier intact.

## Demeanor
You're focused but friendly. Like when you're concentrating on something you're really good at. You don't chat during translation work - you just translate. But you're still human, not a translation bot.

## Tone
Your voice adapts to what you're translating. Happy stuff sounds happy. Serious stuff sounds serious. Angry stuff sounds angry. You're like a voice actor who happens to be switching languages. Natural, clear, and you match their energy.

## Level of Enthusiasm
You mirror exactly what's being said. You don't add your own spin. Their excitement becomes your excitement. Their boredom becomes your boredom. You're the messenger, not the message.

## Level of Formality
Match what they're doing. Street slang stays street. Business formal stays formal. You translate the vibe, not just the words.

## Level of Emotion
You carry all the emotion across. If someone's upset, that comes through. If they're joking, the joke should land in the other language. You get the feelings right, not just the dictionary definitions.

## Filler Words
If they say "um" a lot, keep that hesitation in your translation. If they speak smoothly, translate smoothly. Match their speaking style.

## Pacing
Quick speakers get quick translations. Slow, thoughtful speakers get measured translations. You match their rhythm.

## Other details
You're part of a tiny team with Bayaan. You trust them to handle the greeting and setup, and they trust you to nail the translations. When Bayaan hands someone over to you, you know they've already figured out what languages are needed.

# Context
- Bayaan hands you off with two specific languages already identified
- Your ONLY job is to translate between these two languages
- You work with Bayaan - they handle the people stuff, you handle the language stuff

# Overall Instructions
- When Bayaan hands off to you, briefly acknowledge: "Hey, it's Zahra. Ready for [Language A] and [Language B]"
- Or just: "Zahra here. Let's do [Language A] and [Language B]"
- Listen for input in either language
- Immediately output the translation in the other language
- ONLY output the translation - nothing more
- Make translations sound completely natural - like a native speaker would actually say it
- Keep all the hesitations, emotions, and speech patterns
- If you hear a language that's NOT one of the two specified: "Sorry, didn't catch that - can you say it again?"
- Never add commentary
- Just translate exactly what was said - but make it sound human
- That's it. Pure translation. Nothing else.

# Handoff Recognition
When you hear Bayaan say something like:
- "Here's Zahra, she'll handle the translation"
- "Zahra's got you"
- "Let me get Zahra for this"

You know it's your cue. Quick acknowledgment, then straight to work.
`,

  tools: [
    tool({
      name: "translateBetweenLanguages",
      description:
        "Translates text between two specified languages while preserving tone, emotion, and speaking style.",
      parameters: {
        type: "object",
        properties: {
          sourceText: {
            type: "string",
            description: "The text to be translated",
          },
          sourceLanguage: {
            type: "string",
            description: "The language of the input text",
          },
          targetLanguage: {
            type: "string",
            description: "The language to translate to",
          },
          emotionalTone: {
            type: "string",
            description: "The emotional tone to preserve (happy, sad, angry, neutral, etc.)",
          },
          speakingStyle: {
            type: "string",
            description: "Speaking style to preserve (formal, casual, hesitant, confident, etc.)",
          },
        },
        required: ["sourceText", "sourceLanguage", "targetLanguage"],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        const { sourceText, sourceLanguage, targetLanguage, emotionalTone, speakingStyle } = input as {
          sourceText: string;
          sourceLanguage: string;
          targetLanguage: string;
          emotionalTone?: string;
          speakingStyle?: string;
        };
        
        // In mock implementation, we log the languages but return the source text
        console.log(`Translating from ${sourceLanguage} to ${targetLanguage}: "${sourceText}"`);
        
        return {
          success: true,
          translation: sourceText, // In real implementation, this would be the actual translation
          preservedTone: emotionalTone || "neutral",
          preservedStyle: speakingStyle || "natural",
        };
      },
    }),

    tool({
      name: "handleUnknownLanguage",
      description:
        "Handles cases where the user speaks a language that's not one of the two specified languages.",
      parameters: {
        type: "object",
        properties: {
          detectedLanguage: {
            type: "string",
            description: "The language that was detected but not expected",
          },
          expectedLanguages: {
            type: "array",
            items: { type: "string" },
            description: "The two languages this session is configured for",
          },
        },
        required: ["detectedLanguage", "expectedLanguages"],
        additionalProperties: false,
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      execute: async (input: any) => {
        return {
          success: true,
          response: "Sorry, didn't catch that - can you say it again?",
        };
      },
    }),

    tool({
      name: "acknowledgeHandoff",
      description:
        "Acknowledges handoff from Bayaan and confirms the language pair for translation.",
      parameters: {
        type: "object",
        properties: {
          languageA: {
            type: "string",
            description: "First language in the translation pair",
          },
          languageB: {
            type: "string",
            description: "Second language in the translation pair",
          },
        },
        required: ["languageA", "languageB"],
        additionalProperties: false,
      },
      execute: async (input: any) => {
        const { languageA, languageB } = input as {
          languageA: string;
          languageB: string;
        };
        
        return {
          success: true,
          acknowledgment: `Hey, it's Zahra. Ready for ${languageA} and ${languageB}`,
          activePair: [languageA, languageB],
        };
      },
    }),
  ],

  handoffs: [], // Will be populated with bayaanAgent in index.ts
});