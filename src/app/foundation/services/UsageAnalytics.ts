/**
 * UsageAnalytics - The "Pattern Learning Expert"
 * 
 * This silent background system learns from your behavior patterns:
 * - Which voice commands you use most often
 * - What time of day you use different features  
 * - Common sequences of commands
 * - Preferred layouts and workspace configurations
 * 
 * IMPORTANT: This is NOT a voice agent - it's invisible infrastructure
 * that learns your patterns but never talks to you or appears in conversations.
 * 
 * PHASE 3: Performance & Observability
 * - User behavior pattern analysis
 * - Predictive pre-loading of resources
 * - Personalized optimization recommendations
 * - Smart workflow suggestions (silent, background)
 */

import { EventBus } from './EventBus';

/**
 * User Action - Something you did with your voice assistant
 */
export interface UserAction {
  id: string;
  timestamp: Date;
  type: 'voice-command' | 'navigation' | 'layout-change' | 'module-activation';
  command?: string;           // Original voice command
  details: {
    service: string;          // Which department handled it
    operation: string;        // What specific thing happened
    context: any;            // Additional details
  };
  sessionId: string;         // Groups actions in the same usage session
}

/**
 * Usage Pattern - What the expert learned about your habits
 */
export interface UsagePattern {
  name: string;
  type: 'temporal' | 'sequential' | 'preferential' | 'contextual';
  confidence: number;        // How sure we are (0-100)
  frequency: number;         // How often this pattern occurs
  description: string;       // Human-readable explanation
  data: {
    trigger?: string;        // What starts this pattern
    sequence?: string[];     // Common command sequences
    timing?: {              // When this usually happens
      timeOfDay?: string[];
      dayOfWeek?: string[];
    };
    preferences?: {         // What you prefer
      layouts?: string[];
      modules?: string[];
    };
  };
  lastObserved: Date;
  suggestions: PredictiveSuggestion[];
}

/**
 * Predictive Suggestions - What the expert thinks you might need next
 */
export interface PredictiveSuggestion {
  type: 'preload' | 'layout-suggestion' | 'workflow-optimization';
  confidence: number;
  action: string;           // What should be done
  reasoning: string;        // Why this suggestion was made
  estimatedBenefit: {
    timesSaved?: number;    // Milliseconds saved
    improvementPercent?: number;
  };
}

/**
 * Usage Session - A period of continuous usage
 */
export interface UsageSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  actions: UserAction[];
  patterns: string[];       // Patterns observed in this session
  context: {
    timeOfDay: string;
    dayOfWeek: string;
    sessionDuration?: number;
  };
}

/**
 * UsageAnalytics Implementation - The Silent Pattern Learning Expert
 */
export class UsageAnalytics {
  private eventBus: EventBus;
  private actions: UserAction[] = [];
  private sessions: UsageSession[] = [];
  private patterns = new Map<string, UsagePattern>();
  private currentSessionId: string | null = null;
  private sessionTimeout: NodeJS.Timeout | null = null;
  private readonly MAX_ACTIONS = 10000;
  private readonly MAX_SESSIONS = 1000;
  private readonly SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.setupEventListeners();
    console.log('[UsageAnalytics] 🧠 Pattern learning expert deployed (silent operation)');
  }

  /**
   * Setup automatic pattern learning from user actions
   */
  private setupEventListeners(): void {
    // Learn from navigation patterns
    this.eventBus.onTyped('navigation:section:changed', (data) => {
      this.recordAction({
        type: 'navigation',
        command: `navigate-to-${data.section}`,
        details: {
          service: 'navigation',
          operation: 'section-change',
          context: { section: data.section, contentMode: data.contentMode }
        }
      });
    });

    // Learn from workspace layout patterns  
    this.eventBus.onTyped('workspace:layout:changed', (data) => {
      this.recordAction({
        type: 'layout-change',
        command: `layout-${data.layout}`,
        details: {
          service: 'workspace',
          operation: 'layout-change', 
          context: {
            layout: data.layout,
            panelCount: data.panelCount,
            proportions: data.proportions,
            layoutPattern: data.layoutPattern
          }
        }
      });
    });

    // Learn from module activation patterns
    this.eventBus.onTyped('workspace:module:activated', (data) => {
      this.recordAction({
        type: 'module-activation',
        command: `activate-${data.type}`,
        details: {
          service: 'workspace',
          operation: 'module-activation',
          context: { moduleType: data.type, moduleId: data.moduleId }
        }
      });
    });

    console.log('[UsageAnalytics] 👂 Listening for usage patterns (background monitoring)');
  }

  /**
   * Record a user action (Add to the learning database)
   */
  private recordAction(actionData: Omit<UserAction, 'id' | 'timestamp' | 'sessionId'>): void {
    const action: UserAction = {
      id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      sessionId: this.getCurrentSessionId(),
      ...actionData
    };

    this.actions.push(action);

    // Add to current session
    const currentSession = this.getCurrentSession();
    if (currentSession) {
      currentSession.actions.push(action);
    }

    // Keep memory manageable
    if (this.actions.length > this.MAX_ACTIONS) {
      this.actions = this.actions.slice(-this.MAX_ACTIONS * 0.8); // Keep 80% of max
    }

    // Analyze patterns if we have enough data
    if (this.actions.length % 50 === 0) { // Every 50 actions
      this.analyzePatterns();
    }

    // Reset session timeout
    this.resetSessionTimeout();
  }

  /**
   * Get or create current usage session
   */
  private getCurrentSessionId(): string {
    if (!this.currentSessionId) {
      this.currentSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const newSession: UsageSession = {
        id: this.currentSessionId,
        startTime: new Date(),
        actions: [],
        patterns: [],
        context: {
          timeOfDay: this.getTimeOfDay(),
          dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' })
        }
      };

      this.sessions.push(newSession);

      // Keep sessions manageable
      if (this.sessions.length > this.MAX_SESSIONS) {
        this.sessions = this.sessions.slice(-this.MAX_SESSIONS * 0.8);
      }

      console.log(`[UsageAnalytics] 📝 New usage session started: ${this.currentSessionId}`);
    }

    return this.currentSessionId;
  }

  /**
   * Get current session
   */
  private getCurrentSession(): UsageSession | null {
    const sessionId = this.getCurrentSessionId();
    return this.sessions.find(s => s.id === sessionId) || null;
  }

  /**
   * Reset session timeout (User is still active)
   */
  private resetSessionTimeout(): void {
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
    }

    this.sessionTimeout = setTimeout(() => {
      this.endCurrentSession();
    }, this.SESSION_TIMEOUT_MS);
  }

  /**
   * End current session (User went inactive)
   */
  private endCurrentSession(): void {
    if (this.currentSessionId) {
      const session = this.getCurrentSession();
      if (session) {
        session.endTime = new Date();
        session.context.sessionDuration = session.endTime.getTime() - session.startTime.getTime();
        
        console.log(`[UsageAnalytics] 📊 Session ended: ${this.currentSessionId} (${session.actions.length} actions, ${session.context.sessionDuration}ms duration)`);
      }
      
      this.currentSessionId = null;
    }

    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout);
      this.sessionTimeout = null;
    }
  }

  /**
   * Analyze patterns in user behavior (The learning process)
   */
  private analyzePatterns(): void {
    console.log('[UsageAnalytics] 🧠 Analyzing usage patterns...');

    // Analyze temporal patterns (time-based)
    this.analyzeTemporalPatterns();
    
    // Analyze sequential patterns (command sequences)
    this.analyzeSequentialPatterns();
    
    // Analyze preferential patterns (favorite features)
    this.analyzePreferentialPatterns();

    // Generate predictive suggestions based on learned patterns
    this.generatePredictiveSuggestions();
  }

  /**
   * Analyze when user typically uses different features
   */
  private analyzeTemporalPatterns(): void {
    const timeGroups = new Map<string, UserAction[]>();
    
    for (const action of this.actions.slice(-500)) { // Last 500 actions
      const timeOfDay = this.getTimeOfDay(action.timestamp);
      if (!timeGroups.has(timeOfDay)) {
        timeGroups.set(timeOfDay, []);
      }
      timeGroups.get(timeOfDay)!.push(action);
    }

    for (const [timeOfDay, actionsInTime] of timeGroups) {
      const commandCounts = new Map<string, number>();
      
      actionsInTime.forEach(action => {
        const cmd = action.command || action.details.operation;
        commandCounts.set(cmd, (commandCounts.get(cmd) || 0) + 1);
      });

      // Find most common commands in this time period
      const topCommands = Array.from(commandCounts.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3);

      if (topCommands.length > 0 && topCommands[0][1] > 3) { // Must occur at least 4 times
        const pattern: UsagePattern = {
          name: `${timeOfDay}-usage-pattern`,
          type: 'temporal',
          confidence: Math.min(90, topCommands[0][1] * 10), // Higher usage = higher confidence
          frequency: topCommands[0][1],
          description: `User typically uses "${topCommands[0][0]}" during ${timeOfDay}`,
          data: {
            timing: { timeOfDay: [timeOfDay] },
            preferences: { layouts: topCommands.map(([cmd]) => cmd) }
          },
          lastObserved: new Date(),
          suggestions: [{
            type: 'preload',
            confidence: Math.min(80, topCommands[0][1] * 8),
            action: `preload-${topCommands[0][0]}`,
            reasoning: `User uses "${topCommands[0][0]}" frequently during ${timeOfDay}`,
            estimatedBenefit: { timesSaved: 200 }
          }]
        };

        this.patterns.set(pattern.name, pattern);
      }
    }
  }

  /**
   * Analyze common command sequences
   */
  private analyzeSequentialPatterns(): void {
    const sequences = new Map<string, number>();
    
    // Look for 2-command sequences in recent actions
    for (let i = 0; i < this.actions.length - 1; i++) {
      const current = this.actions[i];
      const next = this.actions[i + 1];
      
      // Only consider actions within 2 minutes of each other
      if (next.timestamp.getTime() - current.timestamp.getTime() < 120000) {
        const currentCmd = current.command || current.details.operation;
        const nextCmd = next.command || next.details.operation;
        const sequence = `${currentCmd} → ${nextCmd}`;
        
        sequences.set(sequence, (sequences.get(sequence) || 0) + 1);
      }
    }

    // Find common sequences (occurred 3+ times)
    for (const [sequence, count] of sequences) {
      if (count >= 3) {
        const [firstCmd, secondCmd] = sequence.split(' → ');
        
        const pattern: UsagePattern = {
          name: `sequence-${firstCmd}-${secondCmd}`,
          type: 'sequential',
          confidence: Math.min(85, count * 15),
          frequency: count,
          description: `User often follows "${firstCmd}" with "${secondCmd}"`,
          data: {
            sequence: [firstCmd, secondCmd],
            trigger: firstCmd
          },
          lastObserved: new Date(),
          suggestions: [{
            type: 'preload',
            confidence: Math.min(75, count * 12),
            action: `preload-after-${firstCmd}`,
            reasoning: `${count} times, user executed "${secondCmd}" after "${firstCmd}"`,
            estimatedBenefit: { timesSaved: 300, improvementPercent: 40 }
          }]
        };

        this.patterns.set(pattern.name, pattern);
      }
    }
  }

  /**
   * Analyze what features/layouts user prefers most
   */
  private analyzePreferentialPatterns(): void {
    const layoutCounts = new Map<string, number>();
    const moduleCounts = new Map<string, number>();

    // Count layout usage
    this.actions
      .filter(a => a.type === 'layout-change')
      .forEach(action => {
        const layout = action.details.context?.layout || 'unknown';
        layoutCounts.set(layout, (layoutCounts.get(layout) || 0) + 1);
      });

    // Count module usage
    this.actions
      .filter(a => a.type === 'module-activation')
      .forEach(action => {
        const moduleType = action.details.context?.moduleType || 'unknown';
        moduleCounts.set(moduleType, (moduleCounts.get(moduleType) || 0) + 1);
      });

    // Create preference patterns for top layouts
    const topLayouts = Array.from(layoutCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    topLayouts.forEach(([layout, count]) => {
      if (count >= 3) {
        const pattern: UsagePattern = {
          name: `preferred-layout-${layout}`,
          type: 'preferential',
          confidence: Math.min(90, count * 20),
          frequency: count,
          description: `User prefers "${layout}" layout (used ${count} times)`,
          data: {
            preferences: { layouts: [layout] }
          },
          lastObserved: new Date(),
          suggestions: [{
            type: 'layout-suggestion',
            confidence: Math.min(80, count * 15),
            action: `suggest-${layout}`,
            reasoning: `Layout "${layout}" is used ${count} times more than others`,
            estimatedBenefit: { improvementPercent: 25 }
          }]
        };

        this.patterns.set(pattern.name, pattern);
      }
    });
  }

  /**
   * Generate suggestions based on learned patterns
   */
  private generatePredictiveSuggestions(): void {
    const now = new Date();
    const currentTimeOfDay = this.getTimeOfDay();
    const activeSuggestions: PredictiveSuggestion[] = [];

    // Check temporal patterns for current time
    for (const pattern of this.patterns.values()) {
      if (pattern.type === 'temporal' && 
          pattern.data.timing?.timeOfDay?.includes(currentTimeOfDay) &&
          pattern.confidence > 60) {
        
        activeSuggestions.push(...pattern.suggestions);
      }
    }

    // Emit suggestions for system optimization (background only)
    if (activeSuggestions.length > 0) {
      this.eventBus.emitTyped('integration:suggestions:updated', {
        suggestions: activeSuggestions,
        context: { timeOfDay: currentTimeOfDay, timestamp: now }
      });
    }
  }

  /**
   * Get time of day category
   */
  private getTimeOfDay(timestamp?: Date): string {
    const hour = (timestamp || new Date()).getHours();
    if (hour < 6) return 'night';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  /**
   * Get learned patterns (for debugging and monitoring)
   */
  getLearnedPatterns(): {
    totalPatterns: number;
    highConfidencePatterns: UsagePattern[];
    recentActivity: UserAction[];
    currentSession: UsageSession | null;
    insights: {
      mostUsedCommands: Array<{ command: string; count: number }>;
      preferredTimeOfDay: string;
      averageSessionLength: number;
      mostCommonSequences: Array<{ sequence: string; frequency: number }>;
    };
  } {
    const allPatterns = Array.from(this.patterns.values());
    const highConfidencePatterns = allPatterns.filter(p => p.confidence > 70);
    const recentActivity = this.actions.slice(-20);

    // Calculate insights
    const commandCounts = new Map<string, number>();
    this.actions.forEach(action => {
      const cmd = action.command || action.details.operation;
      commandCounts.set(cmd, (commandCounts.get(cmd) || 0) + 1);
    });

    const mostUsedCommands = Array.from(commandCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([command, count]) => ({ command, count }));

    // Find most active time of day
    const timeCounts = new Map<string, number>();
    this.actions.forEach(action => {
      const timeOfDay = this.getTimeOfDay(action.timestamp);
      timeCounts.set(timeOfDay, (timeCounts.get(timeOfDay) || 0) + 1);
    });
    const preferredTimeOfDay = Array.from(timeCounts.entries())
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'unknown';

    // Calculate average session length
    const completedSessions = this.sessions.filter(s => s.endTime);
    const averageSessionLength = completedSessions.length > 0
      ? completedSessions.reduce((sum, s) => sum + (s.context.sessionDuration || 0), 0) / completedSessions.length
      : 0;

    return {
      totalPatterns: allPatterns.length,
      highConfidencePatterns,
      recentActivity,
      currentSession: this.getCurrentSession(),
      insights: {
        mostUsedCommands,
        preferredTimeOfDay,
        averageSessionLength,
        mostCommonSequences: [] // Would be populated with sequence analysis
      }
    };
  }

  /**
   * Get predictions for what user might do next (for pre-loading)
   */
  getPredictions(): {
    likelyNextCommands: Array<{ command: string; probability: number; reasoning: string }>;
    suggestedPreloads: Array<{ resource: string; benefit: string }>;
    timeBasedSuggestions: Array<{ suggestion: string; confidence: number }>;
  } {
    const currentTimeOfDay = this.getTimeOfDay();
    const recentActions = this.actions.slice(-5); // Last 5 actions
    
    const predictions = {
      likelyNextCommands: [] as any[],
      suggestedPreloads: [] as any[],
      timeBasedSuggestions: [] as any[]
    };

    // Check sequential patterns
    for (const pattern of this.patterns.values()) {
      if (pattern.type === 'sequential' && pattern.confidence > 60) {
        const trigger = pattern.data.trigger;
        const sequence = pattern.data.sequence;
        
        if (recentActions.some(a => (a.command || a.details.operation) === trigger) && sequence) {
          predictions.likelyNextCommands.push({
            command: sequence[1],
            probability: pattern.confidence,
            reasoning: pattern.description
          });
        }
      }
    }

    // Check temporal patterns for current time
    for (const pattern of this.patterns.values()) {
      if (pattern.type === 'temporal' && 
          pattern.data.timing?.timeOfDay?.includes(currentTimeOfDay) &&
          pattern.confidence > 50) {
        
        predictions.timeBasedSuggestions.push({
          suggestion: `Consider pre-loading for ${pattern.description}`,
          confidence: pattern.confidence
        });
      }
    }

    return predictions;
  }

  /**
   * Clear old data to manage memory
   */
  clearOldData(olderThanDays: number = 7): void {
    const cutoffTime = new Date(Date.now() - olderThanDays * 24 * 3600000);
    
    // Clear old actions
    this.actions = this.actions.filter(a => a.timestamp > cutoffTime);
    
    // Clear old sessions
    this.sessions = this.sessions.filter(s => s.startTime > cutoffTime);
    
    // Update pattern last observed times, remove stale patterns
    for (const [name, pattern] of this.patterns) {
      if (pattern.lastObserved < cutoffTime) {
        this.patterns.delete(name);
      }
    }

    console.log(`[UsageAnalytics] 🧹 Cleared data older than ${olderThanDays} days`);
  }
}

/**
 * Create a usage analytics instance
 */
export function createUsageAnalytics(eventBus: EventBus): UsageAnalytics {
  return new UsageAnalytics(eventBus);
}