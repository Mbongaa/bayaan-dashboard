/**
 * Service Monitor - The "Building Security Guards"
 * 
 * This system constantly watches all the departments (services) to make sure
 * they're working properly. If something goes wrong, it can automatically
 * fix problems or alert the building manager.
 * 
 * PHASE 2: Service Health Monitoring and Auto-Recovery
 * - Continuous health monitoring of all services
 * - Automatic problem detection and recovery
 * - Performance metrics collection
 * - Alert system for critical issues
 */

import { EventBus } from './EventBus';
import { ServiceHealth, SystemHealth, HealthAlert, ServiceContainer } from './ServiceContainer';

/**
 * Performance Metrics - How we measure if departments are working efficiently
 */
export interface PerformanceMetrics {
  serviceName: string;
  responseTime: {
    average: number;
    min: number;
    max: number;
    samples: number[];
  };
  throughput: {
    eventsPerSecond: number;
    requestsPerSecond: number;
  };
  resources: {
    memoryUsage: number;
    cpuUsage: number;
  };
  errors: {
    count: number;
    rate: number;
    recentErrors: Array<{
      timestamp: Date;
      error: Error;
      context?: any;
    }>;
  };
}

/**
 * Recovery Strategy - How to fix problems automatically
 */
export interface RecoveryStrategy {
  serviceName: string;
  strategies: Array<{
    name: string;
    action: () => Promise<boolean>;
    maxAttempts: number;
    cooldownMs: number;
  }>;
}

/**
 * Service Monitor Implementation
 */
export class ServiceMonitorImpl {
  private serviceContainer: ServiceContainer;
  private eventBus: EventBus;
  private healthChecks = new Map<string, () => Promise<ServiceHealth>>();
  private performanceMetrics = new Map<string, PerformanceMetrics>();
  private alerts: HealthAlert[] = [];
  private recoveryStrategies = new Map<string, RecoveryStrategy>();
  
  private monitoringInterval?: NodeJS.Timeout;
  private isMonitoring: boolean = false;
  
  constructor(serviceContainer: ServiceContainer, eventBus: EventBus) {
    this.serviceContainer = serviceContainer;
    this.eventBus = eventBus;
    
    console.log('[ServiceMonitor] Service health monitor initialized');
  }

  /**
   * Register a health check for a service (Teach security guard how to check each department)
   */
  registerHealthCheck(serviceName: string, check: () => Promise<ServiceHealth>): void {
    this.healthChecks.set(serviceName, check);
    console.log(`[ServiceMonitor] Health check registered for service: ${serviceName}`);
  }

  /**
   * Start monitoring all services (Deploy the security guards)
   */
  startMonitoring(interval: number = 30000): void {
    if (this.isMonitoring) {
      console.warn('[ServiceMonitor] Already monitoring');
      return;
    }

    console.log(`[ServiceMonitor] Starting health monitoring (checking every ${interval/1000}s)`);
    this.isMonitoring = true;
    
    this.monitoringInterval = setInterval(() => {
      this.performHealthChecks();
    }, interval);
    
    // Perform initial health check
    this.performHealthChecks();
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    
    this.isMonitoring = false;
    console.log('[ServiceMonitor] Health monitoring stopped');
  }

  /**
   * Perform health checks on all services
   */
  private async performHealthChecks(): Promise<void> {
    console.log('[ServiceMonitor] 🔍 Performing health checks...');
    
    for (const [serviceName, healthCheck] of this.healthChecks) {
      try {
        const health = await healthCheck();
        this.updatePerformanceMetrics(serviceName, health);
        
        // Check for issues and trigger recovery if needed
        if (health.status === 'unhealthy') {
          console.warn(`[ServiceMonitor] ⚠️ Service ${serviceName} is unhealthy`);
          await this.attemptRecovery(serviceName);
        }
        
      } catch (error) {
        console.error(`[ServiceMonitor] ❌ Health check failed for ${serviceName}:`, error);
        this.createAlert('critical', serviceName, `Health check failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * Update performance metrics for a service
   */
  private updatePerformanceMetrics(serviceName: string, health: ServiceHealth): void {
    let metrics = this.performanceMetrics.get(serviceName);
    
    if (!metrics) {
      metrics = {
        serviceName,
        responseTime: { average: 0, min: Infinity, max: 0, samples: [] },
        throughput: { eventsPerSecond: 0, requestsPerSecond: 0 },
        resources: { memoryUsage: 0, cpuUsage: 0 },
        errors: { count: 0, rate: 0, recentErrors: [] }
      };
      this.performanceMetrics.set(serviceName, metrics);
    }

    // Update response time metrics
    const responseTime = health.metrics.responseTime;
    metrics.responseTime.samples.push(responseTime);
    if (metrics.responseTime.samples.length > 100) {
      metrics.responseTime.samples.shift(); // Keep only last 100 samples
    }
    
    metrics.responseTime.average = metrics.responseTime.samples.reduce((a, b) => a + b) / metrics.responseTime.samples.length;
    metrics.responseTime.min = Math.min(metrics.responseTime.min, responseTime);
    metrics.responseTime.max = Math.max(metrics.responseTime.max, responseTime);
    
    // Update resource metrics
    metrics.resources.memoryUsage = health.metrics.memoryUsage;
    
    // Update error metrics
    if (health.lastError) {
      metrics.errors.count = health.errorCount;
      metrics.errors.recentErrors.push({
        timestamp: new Date(),
        error: health.lastError
      });
      
      // Keep only recent errors
      const oneHourAgo = new Date(Date.now() - 3600000);
      metrics.errors.recentErrors = metrics.errors.recentErrors.filter(
        err => err.timestamp > oneHourAgo
      );
    }
  }

  /**
   * Attempt to recover a failed service (Auto-fix problems)
   */
  async attemptRecovery(serviceName: string): Promise<boolean> {
    console.log(`[ServiceMonitor] 🔧 Attempting recovery for service: ${serviceName}`);
    
    const strategy = this.recoveryStrategies.get(serviceName);
    if (!strategy) {
      console.warn(`[ServiceMonitor] No recovery strategy for service: ${serviceName}`);
      return false;
    }

    for (const recoveryAction of strategy.strategies) {
      try {
        console.log(`[ServiceMonitor] Trying recovery strategy: ${recoveryAction.name}`);
        const success = await recoveryAction.action();
        
        if (success) {
          console.log(`[ServiceMonitor] ✅ Recovery successful for ${serviceName} using ${recoveryAction.name}`);
          this.createAlert('info', serviceName, `Automatically recovered using ${recoveryAction.name}`);
          return true;
        }
      } catch (error) {
        console.error(`[ServiceMonitor] Recovery strategy ${recoveryAction.name} failed:`, error);
      }
    }

    console.error(`[ServiceMonitor] ❌ All recovery strategies failed for ${serviceName}`);
    this.createAlert('critical', serviceName, 'All automatic recovery attempts failed');
    return false;
  }

  /**
   * Create an alert (Security guard reports a problem)
   */
  private createAlert(severity: 'info' | 'warning' | 'critical', service: string, message: string): void {
    const alert: HealthAlert = {
      severity,
      service,
      message,
      timestamp: new Date(),
      resolved: false
    };
    
    this.alerts.push(alert);
    
    // Keep only recent alerts
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-500);
    }
    
    // Emit alert event
    this.eventBus.emitTyped('integration:error:alert', {
      alert,
      systemHealth: this.getSystemHealthSync()
    });
    
    console.log(`[ServiceMonitor] 🚨 ${severity.toUpperCase()} Alert: ${service} - ${message}`);
  }

  /**
   * Get current system health (How healthy is the whole building?)
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const serviceHealths: ServiceHealth[] = [];
    
    for (const [serviceName, healthCheck] of this.healthChecks) {
      try {
        const health = await healthCheck();
        serviceHealths.push(health);
      } catch (error) {
        serviceHealths.push({
          name: serviceName,
          status: 'unhealthy',
          uptime: 0,
          errorCount: 1,
          lastError: error instanceof Error ? error : new Error(String(error)),
          metrics: { responseTime: 0, memoryUsage: 0, eventProcessingRate: 0 }
        });
      }
    }

    // Calculate overall status
    const healthyCount = serviceHealths.filter(h => h.status === 'healthy').length;
    const total = serviceHealths.length;
    
    let overallStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (healthyCount === 0) {
      overallStatus = 'critical';
    } else if (healthyCount < total * 0.7) {
      overallStatus = 'degraded';
    }

    // Get recent unresolved alerts
    const recentAlerts = this.alerts.filter(a => !a.resolved && 
      a.timestamp > new Date(Date.now() - 3600000) // Last hour
    );

    return {
      overallStatus,
      timestamp: new Date(),
      services: serviceHealths,
      alerts: recentAlerts,
      recommendations: this.generateRecommendations(serviceHealths, recentAlerts)
    };
  }

  /**
   * Get system health synchronously (for immediate checks)
   */
  private getSystemHealthSync(): SystemHealth {
    // Simplified sync version for alerts
    return {
      overallStatus: 'healthy', // Will be calculated properly in async version
      timestamp: new Date(),
      services: [],
      alerts: this.alerts.filter(a => !a.resolved),
      recommendations: []
    };
  }

  /**
   * Generate recommendations based on system health
   */
  private generateRecommendations(services: ServiceHealth[], alerts: HealthAlert[]): string[] {
    const recommendations: string[] = [];
    
    // Check for high error rates
    services.forEach(service => {
      if (service.errorCount > 10) {
        recommendations.push(`Consider investigating ${service.name} service - high error count (${service.errorCount})`);
      }
      
      if (service.metrics.responseTime > 1000) {
        recommendations.push(`${service.name} service has slow response time (${service.metrics.responseTime}ms) - consider optimization`);
      }
    });
    
    // Check for critical alerts
    const criticalAlerts = alerts.filter(a => a.severity === 'critical' && !a.resolved);
    if (criticalAlerts.length > 0) {
      recommendations.push('Critical issues detected - immediate attention recommended');
    }
    
    return recommendations;
  }

  /**
   * Get performance metrics for all services
   */
  getPerformanceMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.performanceMetrics);
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(hours: number = 24): HealthAlert[] {
    const cutoffTime = new Date(Date.now() - hours * 3600000);
    return this.alerts.filter(alert => alert.timestamp > cutoffTime);
  }
}

/**
 * Create a default service monitor instance
 */
export function createServiceMonitor(serviceContainer: ServiceContainer, eventBus: EventBus): ServiceMonitorImpl {
  const monitor = new ServiceMonitorImpl(serviceContainer, eventBus);
  
  // Register default health checks for common services
  monitor.registerHealthCheck('navigation', async () => ({
    name: 'navigation',
    status: 'healthy',
    uptime: Date.now(),
    errorCount: 0,
    metrics: {
      responseTime: Math.random() * 50 + 10, // Simulated metrics
      memoryUsage: Math.random() * 10 + 5,
      eventProcessingRate: Math.random() * 100 + 50
    }
  }));

  monitor.registerHealthCheck('workspace', async () => ({
    name: 'workspace',
    status: 'healthy',
    uptime: Date.now(),
    errorCount: 0,
    metrics: {
      responseTime: Math.random() * 30 + 15,
      memoryUsage: Math.random() * 15 + 8,
      eventProcessingRate: Math.random() * 80 + 40
    }
  }));

  return monitor;
}