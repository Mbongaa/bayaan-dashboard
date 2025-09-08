import { bayaanAgent } from "./bayaan";

// No handoffs needed - Bayaan handles everything directly
bayaanAgent.handoffs = [];

// Export the Bayaan agent scenario
// Single agent that handles all functionality
export const bayaanGeneralScenario = [
  bayaanAgent  // Main agent with all capabilities
];

// Company name for display
export const bayaanGeneralCompanyName = "Bayaan AI";

export default bayaanGeneralScenario;