import { simpleHandoffScenario } from './simpleHandoff';
import { customerServiceRetailScenario } from './customerServiceRetail';
import { chatSupervisorScenario } from './chatSupervisor';
import { medicalTranslationScenario } from './medicalTranslation';
import { translationScenario } from './translation';
import { translationDirectScenario } from './translationDirect';

import type { RealtimeAgent } from '@openai/agents/realtime';

// Map of scenario key -> array of RealtimeAgent objects
export const allAgentSets: Record<string, RealtimeAgent[]> = {
  simpleHandoff: simpleHandoffScenario,
  customerServiceRetail: customerServiceRetailScenario,
  chatSupervisor: chatSupervisorScenario,
  medicalTranslation: medicalTranslationScenario,
  translation: translationScenario,
  translationDirect: translationDirectScenario,
};

export const defaultAgentSetKey = 'translationDirect';
