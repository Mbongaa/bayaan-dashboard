import { simpleHandoffScenario } from './simpleHandoff';
import { customerServiceRetailScenario } from './customerServiceRetail';
import { chatSupervisorScenario } from './chatSupervisor';
import { translationDirectScenario } from './translationDirect';
import { bayaanGeneralScenario } from './bayaanGeneral';
import { jarvisCoreScenario } from './jarvisCore';

import type { RealtimeAgent } from '@openai/agents/realtime';

// Map of scenario key -> array of RealtimeAgent objects
export const allAgentSets: Record<string, RealtimeAgent[]> = {
  bayaanGeneral: bayaanGeneralScenario,
  jarvisCore: jarvisCoreScenario, // New Chat-Supervisor dashboard manager
  simpleHandoff: simpleHandoffScenario,
  customerServiceRetail: customerServiceRetailScenario,
  chatSupervisor: chatSupervisorScenario,
  translationDirect: translationDirectScenario,
};

export const defaultAgentSetKey = 'bayaanGeneral';
