import { RealtimeAgent } from '@openai/agents/realtime';
import { jarvisAgent } from './jarvisAgent';

// Export the jarvisCore scenario using the Chat-Supervisor pattern
export const jarvisCoreScenario: RealtimeAgent[] = [jarvisAgent];

// Company name for guardrails
export const jarvisCoreCompanyName = 'Jarvis Dashboard';

export default jarvisCoreScenario;