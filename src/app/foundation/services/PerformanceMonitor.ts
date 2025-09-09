/**
 * PerformanceMonitor - The "Stopwatch Efficiency Expert"
 * 
 * This invisible background system measures everything with a stopwatch:
 * - How long voice commands take to execute
 * - Which layout operations are slow or fast  
 * - Event processing speeds across the system
 * - Resource usage patterns over time
 * 
 * IMPORTANT: This is NOT a voice agent - it's pure background infrastructure
 * that measures performance but never talks to users or appears in conversations.
 * 
 * PHASE 3: Performance & Observability
 * - Real-time performance measurement
 * - Automatic optimization identification
 * - Performance trend analysis
 * - Bottleneck detection and reporting
 */

import { EventBus } from './EventBus';

/**
 * Performance Measurement Data
 */
export interface PerformanceMeasurement {
  operation: string;          // What was measured (e.g., "voice-command:70/30-split")
  duration: number;           // How long it took (milliseconds)
  timestamp: Date;           // When it happened
  context: {
    service: string;         // Which service performed the operation
    eventType?: string;      // What type of event triggered it
    userCommand?: string;    // Original voice command (if applicable)
    customData?: any;        // Additional context
  };
}

/**
 * Performance Statistics - What the efficiency expert learned
 */
export interface PerformanceStats {
  operation: string;
  measurements: {
    count: number;
    averageMs: number;
    minMs: number;
    maxMs: number;
    recentTrend: 'improving' | 'degrading' | 'stable';
  };
  percentiles: {
    p50: number;  // 50% of operations complete within this time
    p95: number;  // 95% of operations complete within this time
    p99: number;  // 99% of operations complete within this time
  };
  recommendations: string[];
}

/**
 * Performance Trend Analysis
 */
export interface PerformanceTrend {
  timeWindow: '1hour' | '1day' | '1week';
  operations: Array<{
    name: string;
    changePercent: number;
    status: 'faster' | 'slower' | 'unchanged';
  }>;
  overallSystemTrend: 'improving' | 'degrading' | 'stable';
}

/**
 * PerformanceMonitor Implementation - The Silent Efficiency Expert
 */
export class PerformanceMonitor {
  private measurements = new Map<string, PerformanceMeasurement[]>();
  private eventBus: EventBus;
  private activeTimers = new Map<string, number>();
  private maxMeasurementsPerOperation = 1000;
  
  // Performance improvement tracking
  private baselinePerformance = new Map<string, number>();
  private optimizationLog: Array<{
    operation: string;
    beforeMs: number;
    afterMs: number;
    improvementPercent: number;
    timestamp: Date;
    method: string;
  }> = [];

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.setupAutomaticMeasurement();
    console.log('[PerformanceMonitor] 📊 Silent efficiency expert deployed');
  }

  /**
   * Start measuring an operation (Start the stopwatch)
   */
  startMeasurement(operationId: string, operation: string, context: PerformanceMeasurement['context']): void {
    const startTime = performance.now();
    this.activeTimers.set(operationId, startTime);
    
    // Store context for when measurement completes
    (this.activeTimers as any)[operationId + ':context'] = { operation, context };
  }

  /**
   * Complete measurement (Stop the stopwatch and record results)
   */
  completeMeasurement(operationId: string): number | null {
    const startTime = this.activeTimers.get(operationId);
    if (!startTime) return null;

    const duration = performance.now() - startTime;
    const contextData = (this.activeTimers as any)[operationId + ':context'];
    
    if (contextData) {
      this.recordMeasurement({
        operation: contextData.operation,
        duration,
        timestamp: new Date(),
        context: contextData.context
      });
    }

    // Cleanup
    this.activeTimers.delete(operationId);
    delete (this.activeTimers as any)[operationId + ':context'];

    return duration;
  }

  /**
   * Record a completed measurement (Add data to the efficiency report)
   */
  private recordMeasurement(measurement: PerformanceMeasurement): void {
    const { operation } = measurement;
    
    if (!this.measurements.has(operation)) {
      this.measurements.set(operation, []);
    }

    const measurements = this.measurements.get(operation)!;
    measurements.push(measurement);

    // Keep only recent measurements to avoid memory issues
    if (measurements.length > this.maxMeasurementsPerOperation) {
      measurements.shift();
    }

    // Check if this is a performance improvement
    this.checkForImprovement(operation, measurement.duration);

    // Log interesting findings (only in development)
    if (process.env.NODE_ENV === 'development' && measurements.length % 10 === 0) {
      const stats = this.getOperationStats(operation);
      console.log(`[PerformanceMonitor] 📊 ${operation}: avg ${stats.measurements.averageMs.toFixed(1)}ms (${stats.measurements.count} samples)`);
    }
  }

  /**
   * Check if performance has improved (Celebrate efficiency wins)
   */
  private checkForImprovement(operation: string, currentDuration: number): void {
    const baseline = this.baselinePerformance.get(operation);
    
    if (!baseline) {
      // First measurement becomes baseline
      this.baselinePerformance.set(operation, currentDuration);
      return;
    }

    // Check for significant improvement (20% or more)
    const improvementPercent = ((baseline - currentDuration) / baseline) * 100;
    
    if (improvementPercent > 20) {
      console.log(`[PerformanceMonitor] 🚀 Performance improvement detected: ${operation} is ${improvementPercent.toFixed(1)}% faster!`);
      
      this.optimizationLog.push({
        operation,
        beforeMs: baseline,
        afterMs: currentDuration,
        improvementPercent,
        timestamp: new Date(),
        method: 'automatic'
      });

      // Update baseline
      this.baselinePerformance.set(operation, currentDuration);

      // Emit improvement event
      this.eventBus.emitTyped('integration:performance:optimized', {
        operation,
        improvement: improvementPercent,
        method: 'automatic'
      });
    }
  }

  /**
   * Setup automatic measurement of all voice commands and layout operations
   */
  private setupAutomaticMeasurement(): void {
    // Measure workspace layout operations
    this.eventBus.onTyped('workspace:layout:changed', (data) => {
      this.recordMeasurement({
        operation: `workspace-layout:${data.layout}`,
        duration: 0, // Will be measured by the service
        timestamp: new Date(),
        context: {
          service: 'workspace',
          eventType: 'layout-change',
          customData: {
            layoutType: data.layout,
            panelCount: data.panelCount,
            hasProportions: !!data.proportions,
            layoutPattern: data.layoutPattern
          }
        }
      });
    });

    // Measure navigation operations
    this.eventBus.onTyped('navigation:section:changed', (data) => {
      this.recordMeasurement({
        operation: `navigation-section:${data.section}`,
        duration: 0,
        timestamp: new Date(),
        context: {
          service: 'navigation',
          eventType: 'section-change',
          customData: {
            section: data.section,
            contentMode: data.contentMode
          }
        }
      });
    });

    console.log('[PerformanceMonitor] 🔍 Automatic measurement setup complete');
  }

  /**
   * Get performance statistics for an operation
   */
  getOperationStats(operation: string): PerformanceStats {
    const measurements = this.measurements.get(operation) || [];
    
    if (measurements.length === 0) {
      return {
        operation,
        measurements: { count: 0, averageMs: 0, minMs: 0, maxMs: 0, recentTrend: 'stable' },
        percentiles: { p50: 0, p95: 0, p99: 0 },
        recommendations: ['No data available for this operation']
      };
    }

    const durations = measurements.map(m => m.duration).sort((a, b) => a - b);
    const count = durations.length;
    const average = durations.reduce((a, b) => a + b) / count;
    const min = durations[0];
    const max = durations[count - 1];

    // Calculate percentiles
    const p50 = durations[Math.floor(count * 0.5)];
    const p95 = durations[Math.floor(count * 0.95)];
    const p99 = durations[Math.floor(count * 0.99)];

    // Analyze recent trend (last 20% of measurements vs previous 20%)
    const recentCount = Math.floor(count * 0.2);
    const recentMeasurements = durations.slice(-recentCount);
    const previousMeasurements = durations.slice(-recentCount * 2, -recentCount);
    
    let recentTrend: 'improving' | 'degrading' | 'stable' = 'stable';
    if (recentMeasurements.length > 0 && previousMeasurements.length > 0) {
      const recentAvg = recentMeasurements.reduce((a, b) => a + b) / recentMeasurements.length;
      const previousAvg = previousMeasurements.reduce((a, b) => a + b) / previousMeasurements.length;
      
      if (recentAvg < previousAvg * 0.9) recentTrend = 'improving';
      else if (recentAvg > previousAvg * 1.1) recentTrend = 'degrading';
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (average > 1000) recommendations.push('Operation takes over 1 second - consider optimization');
    if (max > average * 3) recommendations.push('High variance detected - investigate outliers');
    if (recentTrend === 'degrading') recommendations.push('Performance declining - needs attention');
    if (recentTrend === 'improving') recommendations.push('Performance improving - optimizations working');

    return {
      operation,
      measurements: { count, averageMs: average, minMs: min, maxMs: max, recentTrend },
      percentiles: { p50, p95, p99 },
      recommendations
    };
  }

  /**
   * Get overall system performance summary
   */
  getSystemPerformanceSummary(): {
    totalOperationsMeasured: number;
    averageResponseTime: number;
    slowestOperations: Array<{ operation: string; averageMs: number }>;
    fastestOperations: Array<{ operation: string; averageMs: number }>;
    recentOptimizations: Array<{
      operation: string;
      beforeMs: number;
      afterMs: number;
      improvementPercent: number;
      timestamp: Date;
      method: string;
    }>;
    systemTrend: 'improving' | 'degrading' | 'stable';
  } {
    const allStats = Array.from(this.measurements.keys()).map(op => this.getOperationStats(op));
    const totalOps = allStats.reduce((sum, stat) => sum + stat.measurements.count, 0);
    const avgResponseTime = allStats.reduce((sum, stat) => sum + stat.measurements.averageMs * stat.measurements.count, 0) / (totalOps || 1);

    // Find slowest and fastest operations
    const sortedBySpeed = allStats
      .filter(stat => stat.measurements.count > 5) // Only operations with enough data
      .sort((a, b) => a.measurements.averageMs - b.measurements.averageMs);

    const fastestOperations = sortedBySpeed.slice(0, 3).map(stat => ({
      operation: stat.operation,
      averageMs: stat.measurements.averageMs
    }));

    const slowestOperations = sortedBySpeed.slice(-3).reverse().map(stat => ({
      operation: stat.operation,
      averageMs: stat.measurements.averageMs
    }));

    // Analyze overall system trend
    const improvingCount = allStats.filter(s => s.measurements.recentTrend === 'improving').length;
    const degradingCount = allStats.filter(s => s.measurements.recentTrend === 'degrading').length;
    
    let systemTrend: 'improving' | 'degrading' | 'stable' = 'stable';
    if (improvingCount > degradingCount * 1.5) systemTrend = 'improving';
    else if (degradingCount > improvingCount * 1.5) systemTrend = 'degrading';

    return {
      totalOperationsMeasured: totalOps,
      averageResponseTime: avgResponseTime,
      slowestOperations,
      fastestOperations,
      recentOptimizations: [...this.optimizationLog].slice(-10), // Last 10 improvements
      systemTrend
    };
  }

  /**
   * Start measuring a voice command (Special timing for voice operations)
   */
  measureVoiceCommand(command: string): string {
    const operationId = `voice-cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.startMeasurement(operationId, `voice-command:${command}`, {
      service: 'voice-assistant',
      eventType: 'voice-command',
      userCommand: command
    });

    return operationId;
  }

  /**
   * Measure workspace layout operations specifically
   */
  measureLayoutOperation(layoutType: string, panelCount?: number, hasProportions?: boolean): string {
    const operationId = `layout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.startMeasurement(operationId, `layout-operation:${layoutType}`, {
      service: 'workspace',
      eventType: 'layout-change',
      customData: {
        layoutType,
        panelCount,
        hasProportions,
        complexity: this.calculateLayoutComplexity(layoutType, panelCount, hasProportions)
      }
    });

    return operationId;
  }

  /**
   * Calculate complexity score for layout operations
   */
  private calculateLayoutComplexity(layoutType: string, panelCount?: number, hasProportions?: boolean): 'simple' | 'moderate' | 'complex' {
    if (layoutType === 'custom' && hasProportions && (panelCount || 0) > 4) {
      return 'complex';
    } else if (layoutType === 'custom' || (panelCount || 0) > 2) {
      return 'moderate';  
    } else {
      return 'simple';
    }
  }

  /**
   * Get top slow operations that need optimization
   */
  getOptimizationOpportunities(): Array<{
    operation: string;
    averageMs: number;
    priority: 'high' | 'medium' | 'low';
    suggestedActions: string[];
  }> {
    const allStats = Array.from(this.measurements.keys()).map(op => this.getOperationStats(op));
    
    return allStats
      .filter(stat => stat.measurements.count >= 5) // Enough data
      .filter(stat => stat.measurements.averageMs > 100) // Slower than 100ms
      .sort((a, b) => b.measurements.averageMs - a.measurements.averageMs) // Slowest first
      .slice(0, 10) // Top 10 opportunities
      .map(stat => {
        let priority: 'high' | 'medium' | 'low' = 'low';
        const avgMs = stat.measurements.averageMs;
        
        if (avgMs > 1000) priority = 'high';
        else if (avgMs > 500) priority = 'medium';

        const suggestedActions: string[] = [];
        if (stat.operation.includes('layout')) {
          suggestedActions.push('Consider layout calculation caching');
          suggestedActions.push('Optimize grid computation algorithms');
        }
        if (stat.operation.includes('voice-command')) {
          suggestedActions.push('Add command prediction and pre-loading');
          suggestedActions.push('Optimize voice command parsing');
        }
        if (avgMs > 1000) {
          suggestedActions.push('Critical: Investigation required for >1s response time');
        }

        return {
          operation: stat.operation,
          averageMs: avgMs,
          priority,
          suggestedActions
        };
      });
  }

  /**
   * Get performance report for debugging (What the efficiency expert learned)
   */
  getPerformanceReport(): {
    summary: ReturnType<PerformanceMonitor['getSystemPerformanceSummary']>;
    topOperations: PerformanceStats[];
    optimizationOpportunities: ReturnType<PerformanceMonitor['getOptimizationOpportunities']>;
    measurementTimeRange: { earliest: Date; latest: Date } | null;
  } {
    const summary = this.getSystemPerformanceSummary();
    const topOperations = Array.from(this.measurements.keys())
      .map(op => this.getOperationStats(op))
      .sort((a, b) => b.measurements.count - a.measurements.count)
      .slice(0, 10);

    // Find time range of measurements
    let earliest: Date | null = null;
    let latest: Date | null = null;

    for (const measurements of this.measurements.values()) {
      for (const measurement of measurements) {
        if (!earliest || measurement.timestamp < earliest) earliest = measurement.timestamp;
        if (!latest || measurement.timestamp > latest) latest = measurement.timestamp;
      }
    }

    return {
      summary,
      topOperations,
      optimizationOpportunities: this.getOptimizationOpportunities(),
      measurementTimeRange: earliest && latest ? { earliest, latest } : null
    };
  }

  /**
   * Clear old measurements (Cleanup old efficiency reports)
   */
  clearOldMeasurements(olderThanHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - olderThanHours * 3600000);
    
    for (const [operation, measurements] of this.measurements) {
      const recentMeasurements = measurements.filter(m => m.timestamp > cutoffTime);
      
      if (recentMeasurements.length === 0) {
        this.measurements.delete(operation);
      } else {
        this.measurements.set(operation, recentMeasurements);
      }
    }

    console.log(`[PerformanceMonitor] 🧹 Cleaned measurements older than ${olderThanHours} hours`);
  }
}

/**
 * Create a performance monitor instance
 */
export function createPerformanceMonitor(eventBus: EventBus): PerformanceMonitor {
  return new PerformanceMonitor(eventBus);
}