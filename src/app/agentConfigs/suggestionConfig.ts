// Suggestion configuration for different agent scenarios
// Each scenario can have its own set of suggestion cards that appear above the chat input

export interface SuggestionCard {
  id: string;
  text: string;
  // Optional: Add more properties like icon, category, etc. in the future
}

export interface ScenarioSuggestions {
  [scenarioKey: string]: SuggestionCard[];
}

// Centralized suggestion configuration for all scenarios
export const scenarioSuggestions: ScenarioSuggestions = {
  // Translation Direct scenario suggestions - showing different language pairs
  translationDirect: [
    {
      id: 'translation-1',
      text: 'Arabic and English'
    },
    {
      id: 'translation-2',
      text: 'English and Kurdish'
    },
    {
      id: 'translation-3',
      text: 'Dutch and French'
    },
    {
      id: 'translation-4',
      text: 'Spanish and German'
    }
  ],
  
  // Bayaan General scenario suggestions (placeholder for future use)
  bayaanGeneral: [
    // Add suggestions when needed
  ],
  
  // Jarvis Core scenario suggestions (placeholder for future use)
  jarvisCore: [
    // Add suggestions when needed
  ],
  
  // Customer Service Retail scenario suggestions (placeholder for future use)
  customerServiceRetail: [
    // Add suggestions when needed
  ],
  
  // Chat Supervisor scenario suggestions (placeholder for future use)
  chatSupervisor: [
    // Add suggestions when needed
  ],
  
  // Simple Handoff scenario suggestions (placeholder for future use)
  simpleHandoff: [
    // Add suggestions when needed
  ]
};

// Helper function to get suggestions for a specific scenario
export function getSuggestionsForScenario(scenarioKey: string): SuggestionCard[] {
  return scenarioSuggestions[scenarioKey] || [];
}

// Helper function to check if a scenario has suggestions
export function hasScenarioSuggestions(scenarioKey: string): boolean {
  const suggestions = scenarioSuggestions[scenarioKey];
  return suggestions && suggestions.length > 0;
}