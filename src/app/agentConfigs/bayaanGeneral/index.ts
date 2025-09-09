// Use the optimized version with consolidated tools (14 tools instead of 29)
import { bayaanOptimizedAgent } from "./bayaanOptimized";

// For testing with original (29 tools):
// import { bayaanAgent } from "./bayaan";

// No handoffs needed - Bayaan handles everything directly
bayaanOptimizedAgent.handoffs = [];

// Export the Bayaan agent scenario
// Single agent that handles all functionality with optimized tool set
export const bayaanGeneralScenario = [
  bayaanOptimizedAgent  // Main agent with optimized consolidated tools
];

// Company name for display
export const bayaanGeneralCompanyName = "Bayaan AI";

export default bayaanGeneralScenario;