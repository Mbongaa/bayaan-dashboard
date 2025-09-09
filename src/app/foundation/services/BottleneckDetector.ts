/**
 * BottleneckDetector - The "Traffic Jam Hunter"
 * 
 * This silent background system hunts for performance bottlenecks:
 * - Identifies where voice commands get stuck or slow
 * - Detects which operations are causing delays
 * - Finds system resource contention issues  
 * - Suggests automatic optimizations
 * 
 * IMPORTANT: This is NOT a voice agent - it's invisible infrastructure
 * that finds bottlenecks but never talks to users or appears in conversations.
 * 
 * PHASE 3: Performance & Observability
 * - Real-time bottleneck detection
 * - Performance correlation analysis
 * - Automatic optimization suggestions
 * - System load balancing insights
 */

import { EventBus } from './EventBus';
import { PerformanceMonitor } from './PerformanceMonitor';

/**
 * Bottleneck - A detected performance problem
 */
export interface Bottleneck {
  id: string;
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'response-time' | 'memory' | 'concurrency' | 'computation' | 'event-processing';
  description: string;
  location: {
    service: string;
    operation: string;
    method?: string;
  };
  metrics: {
    averageDelayMs: number;
    peakDelayMs: number;
    frequency: number;        // How often this bottleneck occurs
    impactScore: number;      // 0-100 score of user impact
  };
  detectedAt: Date;
  lastObserved: Date;
  isActive: boolean;
  suggestions: BottleneckSuggestion[];
}

/**
 * Bottleneck Suggestion - How to fix the traffic jam
 */
export interface BottleneckSuggestion {
  type: 'caching' | 'algorithm' | 'parallelization' | 'resource-allocation' | 'code-optimization';
  description: string;
  implementation: string;
  estimatedImprovement: {
    timeReductionMs: number;
    improvementPercent: number;
  };
  complexity: 'easy' | 'moderate' | 'complex';
  priority: number; // 1-10, higher = more important
}

/**
 * Performance Correlation - Relationships between slow operations
 */
export interface PerformanceCorrelation {
  operation1: string;
  operation2: string;
  correlationStrength: number; // 0-1, higher = more correlated
  relationship: 'causes' | 'coincides-with' | 'blocks';
  description: string;
}

/**
 * BottleneckDetector Implementation - The Silent Traffic Jam Hunter
 */
export class BottleneckDetector {
  private eventBus: EventBus;
  private performanceMonitor: PerformanceMonitor;
  private bottlenecks = new Map<string, Bottleneck>();
  private operationTimings = new Map<string, number[]>();
  private eventQueue: Array<{ event: string; timestamp: number }> = [];
  
  // Detection thresholds
  private readonly SLOW_RESPONSE_THRESHOLD = 500; // 500ms
  private readonly VERY_SLOW_THRESHOLD = 1000;    // 1s
  private readonly CRITICAL_THRESHOLD = 2000;     // 2s
  private readonly MIN_SAMPLES = 5;               // Need at least 5 samples to detect

  constructor(eventBus: EventBus, performanceMonitor: PerformanceMonitor) {
    this.eventBus = eventBus;
    this.performanceMonitor = performanceMonitor;
    this.setupBottleneckDetection();
    console.log('[BottleneckDetector] 🎯 Traffic jam hunter deployed (silent operation)');
  }

  /**
   * Setup automatic bottleneck detection
   */
  private setupBottleneckDetection(): void {
    // Monitor all typed events for performance issues
    const originalEmit = this.eventBus.emitTyped;
    
    // Wrap emitTyped to measure event processing time
    this.eventBus.emitTyped = ((eventName: any, data: any) => {
      const startTime = performance.now();
      
      // Call original emit
      originalEmit.call(this.eventBus, eventName, data);
      
      const duration = performance.now() - startTime;
      this.recordEventTiming(eventName, duration);
      
      // Add to event queue for concurrency analysis
      this.eventQueue.push({ event: eventName, timestamp: startTime });
      
      // Keep queue size manageable
      if (this.eventQueue.length > 1000) {
        this.eventQueue = this.eventQueue.slice(-500);
      }
    }) as any;

    console.log('[BottleneckDetector] 🔍 Event performance monitoring active');
  }

  /**
   * Record timing for an operation (Track how long things take)
   */
  recordEventTiming(eventName: string, duration: number): void {
    if (!this.operationTimings.has(eventName)) {
      this.operationTimings.set(eventName, []);
    }

    const timings = this.operationTimings.get(eventName)!;
    timings.push(duration);

    // Keep only recent timings
    if (timings.length > 100) {
      timings.shift();
    }

    // Analyze for bottlenecks if we have enough data
    if (timings.length >= this.MIN_SAMPLES && timings.length % 10 === 0) {
      this.analyzeForBottlenecks(eventName, timings);
    }
  }

  /**
   * Analyze operation for performance bottlenecks
   */
  private analyzeForBottlenecks(eventName: string, timings: number[]): void {
    const average = timings.reduce((a, b) => a + b) / timings.length;
    const max = Math.max(...timings);
    const recentAverage = timings.slice(-10).reduce((a, b) => a + b) / Math.min(10, timings.length);

    // Detect different types of bottlenecks
    if (average > this.CRITICAL_THRESHOLD) {
      this.createBottleneck({
        name: `critical-slowness-${eventName}`,
        severity: 'critical',
        type: 'response-time',
        description: `${eventName} consistently takes over 2 seconds`,
        location: { service: this.getServiceFromEvent(eventName), operation: eventName },
        averageDelayMs: average,
        peakDelayMs: max,
        frequency: timings.length,
        impactScore: 95
      });
    } else if (average > this.VERY_SLOW_THRESHOLD) {
      this.createBottleneck({
        name: `high-slowness-${eventName}`,
        severity: 'high',
        type: 'response-time',
        description: `${eventName} is slower than 1 second on average`,
        location: { service: this.getServiceFromEvent(eventName), operation: eventName },
        averageDelayMs: average,
        peakDelayMs: max,
        frequency: timings.length,
        impactScore: 75
      });
    } else if (recentAverage > average * 1.5) {
      this.createBottleneck({
        name: `performance-degradation-${eventName}`,
        severity: 'medium',
        type: 'response-time',
        description: `${eventName} is getting slower over time`,
        location: { service: this.getServiceFromEvent(eventName), operation: eventName },
        averageDelayMs: recentAverage,
        peakDelayMs: max,
        frequency: timings.length,
        impactScore: 60
      });
    }

    // Detect high variance (inconsistent performance)
    const variance = this.calculateVariance(timings);
    if (variance > average * 0.5) { // High variance relative to mean
      this.createBottleneck({
        name: `inconsistent-performance-${eventName}`,
        severity: 'medium',
        type: 'response-time',
        description: `${eventName} has inconsistent performance (high variance)`,
        location: { service: this.getServiceFromEvent(eventName), operation: eventName },
        averageDelayMs: average,
        peakDelayMs: max,
        frequency: timings.length,
        impactScore: 50
      });
    }
  }

  /**
   * Create or update a bottleneck record
   */
  private createBottleneck(data: {
    name: string;
    severity: Bottleneck['severity'];
    type: Bottleneck['type'];
    description: string;
    location: Bottleneck['location'];
    averageDelayMs: number;
    peakDelayMs: number;
    frequency: number;
    impactScore: number;
  }): void {
    const existing = this.bottlenecks.get(data.name);
    
    if (existing) {
      // Update existing bottleneck
      existing.metrics = {
        averageDelayMs: data.averageDelayMs,
        peakDelayMs: Math.max(existing.metrics.peakDelayMs, data.peakDelayMs),
        frequency: data.frequency,
        impactScore: data.impactScore
      };
      existing.lastObserved = new Date();
      existing.isActive = true;
    } else {
      // Create new bottleneck
      const bottleneck: Bottleneck = {
        id: `bottleneck-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: data.name,
        severity: data.severity,
        type: data.type,
        description: data.description,
        location: data.location,
        metrics: {
          averageDelayMs: data.averageDelayMs,
          peakDelayMs: data.peakDelayMs,
          frequency: data.frequency,
          impactScore: data.impactScore
        },
        detectedAt: new Date(),
        lastObserved: new Date(),
        isActive: true,
        suggestions: this.generateSuggestions(data)
      };

      this.bottlenecks.set(data.name, bottleneck);

      // Emit bottleneck detection event
      this.eventBus.emitTyped('integration:error:alert', {
        bottleneck: bottleneck,
        severity: data.severity,
        timestamp: new Date()
      });

      console.log(`[BottleneckDetector] 🚨 Bottleneck detected: ${data.description} (${data.severity} severity)`);
    }
  }

  /**
   * Generate optimization suggestions for a bottleneck
   */
  private generateSuggestions(data: {
    location: { service: string; operation: string };
    averageDelayMs: number;
    type: string;
  }): BottleneckSuggestion[] {
    const suggestions: BottleneckSuggestion[] = [];

    // Layout operation suggestions
    if (data.location.operation.includes('layout')) {
      suggestions.push({
        type: 'caching',
        description: 'Cache layout calculations for common patterns',
        implementation: 'Implement layout calculation cache in WorkspaceLayoutService',
        estimatedImprovement: {
          timeReductionMs: Math.min(data.averageDelayMs * 0.8, 800),
          improvementPercent: 80
        },
        complexity: 'easy',
        priority: 9
      });

      if (data.averageDelayMs > 1000) {
        suggestions.push({
          type: 'algorithm',
          description: 'Optimize grid calculation algorithm',
          implementation: 'Implement more efficient layout computation',
          estimatedImprovement: {
            timeReductionMs: Math.min(data.averageDelayMs * 0.6, 600),
            improvementPercent: 60
          },
          complexity: 'moderate',
          priority: 7
        });
      }
    }

    // Navigation operation suggestions
    if (data.location.operation.includes('navigation')) {
      suggestions.push({
        type: 'caching',
        description: 'Cache navigation state transitions',
        implementation: 'Pre-calculate common navigation paths',
        estimatedImprovement: {
          timeReductionMs: Math.min(data.averageDelayMs * 0.7, 350),
          improvementPercent: 70
        },
        complexity: 'easy',
        priority: 8
      });
    }

    // General response time suggestions
    if (data.averageDelayMs > 1500) {
      suggestions.push({
        type: 'parallelization',
        description: 'Parallelize independent operations',
        implementation: 'Split operation into concurrent tasks',
        estimatedImprovement: {
          timeReductionMs: Math.min(data.averageDelayMs * 0.5, 750),
          improvementPercent: 50
        },
        complexity: 'complex',
        priority: 6
      });
    }

    return suggestions.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get service name from event name
   */
  private getServiceFromEvent(eventName: string): string {
    const parts = eventName.split(':');
    return parts[0] || 'unknown';
  }

  /**
   * Calculate variance in timing data
   */
  private calculateVariance(numbers: number[]): number {
    const mean = numbers.reduce((a, b) => a + b) / numbers.length;
    const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b) / numbers.length;
  }

  /**
   * Detect concurrency bottlenecks (Traffic jams from too many things happening at once)
   */
  detectConcurrencyBottlenecks(): Array<{
    timeWindow: string;
    eventCount: number;
    averageProcessingTime: number;
    worstCaseScenario: string;
    suggestion: string;
  }> {
    const bottlenecks = [];
    const now = performance.now();
    
    // Analyze 1-second windows for high event density
    const windowSize = 1000; // 1 second windows
    const recentEvents = this.eventQueue.filter(e => now - e.timestamp < 10000); // Last 10 seconds
    
    for (let i = 0; i < 10; i++) {
      const windowStart = now - (i + 1) * windowSize;
      const windowEnd = now - i * windowSize;
      
      const eventsInWindow = recentEvents.filter(e => 
        e.timestamp >= windowStart && e.timestamp < windowEnd
      );

      if (eventsInWindow.length > 10) { // More than 10 events per second = potential bottleneck
        bottlenecks.push({
          timeWindow: `${windowEnd/1000}s ago`,
          eventCount: eventsInWindow.length,
          averageProcessingTime: 0, // Would calculate from actual measurements
          worstCaseScenario: `System overload with ${eventsInWindow.length} events/second`,
          suggestion: 'Consider event batching or rate limiting'
        });
      }
    }

    return bottlenecks;
  }

  /**
   * Get all active bottlenecks
   */
  getActiveBottlenecks(): {
    critical: Bottleneck[];
    high: Bottleneck[];
    medium: Bottleneck[];
    low: Bottleneck[];
    total: number;
    worstBottleneck: Bottleneck | null;
  } {
    const active = Array.from(this.bottlenecks.values()).filter(b => b.isActive);
    
    const critical = active.filter(b => b.severity === 'critical');
    const high = active.filter(b => b.severity === 'high');
    const medium = active.filter(b => b.severity === 'medium'); 
    const low = active.filter(b => b.severity === 'low');

    // Find worst bottleneck by impact score
    const worstBottleneck = active.length > 0 
      ? active.sort((a, b) => b.metrics.impactScore - a.metrics.impactScore)[0]
      : null;

    return {
      critical,
      high,
      medium,
      low,
      total: active.length,
      worstBottleneck
    };
  }

  /**
   * Get optimization recommendations based on detected bottlenecks
   */
  getOptimizationRecommendations(): Array<{
    bottleneckName: string;
    priority: number;
    suggestions: BottleneckSuggestion[];
    estimatedSystemImprovement: {
      overallSpeedIncrease: number; // Percentage
      userExperienceImpact: 'low' | 'medium' | 'high';
    };
  }> {
    const activeBottlenecks = Array.from(this.bottlenecks.values())
      .filter(b => b.isActive)
      .sort((a, b) => b.metrics.impactScore - a.metrics.impactScore);

    return activeBottlenecks.map(bottleneck => {
      const topSuggestions = bottleneck.suggestions
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 3); // Top 3 suggestions

      // Estimate system-wide improvement
      let overallSpeedIncrease = 0;
      let userExperienceImpact: 'low' | 'medium' | 'high' = 'low';

      if (topSuggestions.length > 0) {
        const bestSuggestion = topSuggestions[0];
        overallSpeedIncrease = Math.min(bestSuggestion.estimatedImprovement.improvementPercent, 50);
        
        if (bottleneck.metrics.impactScore > 80) userExperienceImpact = 'high';
        else if (bottleneck.metrics.impactScore > 50) userExperienceImpact = 'medium';
      }

      return {
        bottleneckName: bottleneck.name,
        priority: bottleneck.metrics.impactScore,
        suggestions: topSuggestions,
        estimatedSystemImprovement: {
          overallSpeedIncrease,
          userExperienceImpact
        }
      };
    });
  }

  /**
   * Analyze performance correlations (Find related slow operations)
   */
  analyzePerformanceCorrelations(): PerformanceCorrelation[] {
    const correlations: PerformanceCorrelation[] = [];
    const operations = Array.from(this.operationTimings.keys());

    // Compare each pair of operations for timing correlations
    for (let i = 0; i < operations.length; i++) {
      for (let j = i + 1; j < operations.length; j++) {
        const op1 = operations[i];
        const op2 = operations[j];
        
        const correlation = this.calculateCorrelation(
          this.operationTimings.get(op1) || [],
          this.operationTimings.get(op2) || []
        );

        if (Math.abs(correlation) > 0.6) { // Strong correlation
          correlations.push({
            operation1: op1,
            operation2: op2,
            correlationStrength: Math.abs(correlation),
            relationship: correlation > 0 ? 'coincides-with' : 'blocks',
            description: correlation > 0 
              ? `${op1} and ${op2} tend to be slow at the same time`
              : `${op1} being slow may affect ${op2} performance`
          });
        }
      }
    }

    return correlations.sort((a, b) => b.correlationStrength - a.correlationStrength);
  }

  /**
   * Calculate correlation coefficient between two timing arrays
   */
  private calculateCorrelation(array1: number[], array2: number[]): number {
    const minLength = Math.min(array1.length, array2.length);
    if (minLength < 5) return 0; // Need sufficient data

    const x = array1.slice(-minLength);
    const y = array2.slice(-minLength);
    
    const meanX = x.reduce((a, b) => a + b) / x.length;
    const meanY = y.reduce((a, b) => a + b) / y.length;
    
    const numerator = x.reduce((sum, xi, i) => sum + (xi - meanX) * (y[i] - meanY), 0);
    const denomX = Math.sqrt(x.reduce((sum, xi) => sum + Math.pow(xi - meanX, 2), 0));
    const denomY = Math.sqrt(y.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0));
    
    if (denomX === 0 || denomY === 0) return 0;
    return numerator / (denomX * denomY);
  }

  /**
   * Get bottleneck detection report (What traffic jams were found)
   */
  getBottleneckReport(): {
    summary: {
      totalBottlenecksDetected: number;
      activeBottlenecks: number;
      worstOffender: string | null;
      systemHealthScore: number; // 0-100
    };
    activeBottlenecks: ReturnType<BottleneckDetector['getActiveBottlenecks']>;
    optimizationRecommendations: ReturnType<BottleneckDetector['getOptimizationRecommendations']>;
    performanceCorrelations: PerformanceCorrelation[];
    concurrencyIssues: ReturnType<BottleneckDetector['detectConcurrencyBottlenecks']>;
  } {
    const activeBottlenecks = this.getActiveBottlenecks();
    const optimizationRecommendations = this.getOptimizationRecommendations();
    const performanceCorrelations = this.analyzePerformanceCorrelations();
    const concurrencyIssues = this.detectConcurrencyBottlenecks();

    // Calculate system health score
    let systemHealthScore = 100;
    systemHealthScore -= activeBottlenecks.critical.length * 25;
    systemHealthScore -= activeBottlenecks.high.length * 15;
    systemHealthScore -= activeBottlenecks.medium.length * 5;
    systemHealthScore = Math.max(0, systemHealthScore);

    return {
      summary: {
        totalBottlenecksDetected: this.bottlenecks.size,
        activeBottlenecks: activeBottlenecks.total,
        worstOffender: activeBottlenecks.worstBottleneck?.name || null,
        systemHealthScore
      },
      activeBottlenecks,
      optimizationRecommendations,
      performanceCorrelations,
      concurrencyIssues
    };
  }

  /**
   * Mark bottleneck as resolved (Traffic jam cleared)
   */
  resolveBottleneck(bottleneckName: string): boolean {
    const bottleneck = this.bottlenecks.get(bottleneckName);
    if (!bottleneck) return false;

    bottleneck.isActive = false;
    console.log(`[BottleneckDetector] ✅ Bottleneck resolved: ${bottleneckName}`);
    
    return true;
  }

  /**
   * Clear old bottleneck records
   */
  clearOldBottlenecks(olderThanDays: number = 7): void {
    const cutoffTime = new Date(Date.now() - olderThanDays * 24 * 3600000);
    
    for (const [name, bottleneck] of this.bottlenecks) {
      if (bottleneck.lastObserved < cutoffTime && !bottleneck.isActive) {
        this.bottlenecks.delete(name);
      }
    }

    console.log(`[BottleneckDetector] 🧹 Cleared bottleneck records older than ${olderThanDays} days`);
  }
}

/**
 * Create a bottleneck detector instance
 */
export function createBottleneckDetector(eventBus: EventBus, performanceMonitor: PerformanceMonitor): BottleneckDetector {
  return new BottleneckDetector(eventBus, performanceMonitor);
}