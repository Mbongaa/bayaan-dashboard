import { bayaanAgent } from './bayaan';
import { zahraAgent } from './zahra';

// Set up bidirectional handoffs between Bayaan and Zahra
// Cast to `any` to satisfy TypeScript until the core types make RealtimeAgent
// assignable to `Agent<unknown>` (current library versions are invariant on
// the context type).
(bayaanAgent.handoffs as any).push(zahraAgent);
(zahraAgent.handoffs as any).push(bayaanAgent);

export const bayaanGeneralScenario = [
  bayaanAgent,
  zahraAgent,
];

// Company name for this scenario (if needed for guardrails)
export const bayaanGeneralCompanyName = 'Bayaan-Zahra Translation Services';