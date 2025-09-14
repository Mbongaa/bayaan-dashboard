import { EventBus, globalEventBus, eventMigrationHelper } from './EventBus';
import { ServiceContainer } from './ServiceContainer';
import { createServiceMonitor, ServiceMonitorImpl } from './ServiceMonitor';
import { createPerformanceMonitor, PerformanceMonitor } from './PerformanceMonitor';
import { createUsageAnalytics, UsageAnalytics } from './UsageAnalytics';
import { createCacheManager, CacheManager } from './CacheManager';
import { createBottleneckDetector, BottleneckDetector } from './BottleneckDetector';
import { WebGLContextService } from './WebGLContextService';
import { WebRTCService } from './WebRTCService';
import { navigationService } from './NavigationService';
import { workspaceDataService } from './WorkspaceDataService';
import { integrationService } from './IntegrationService';
import { WorkspaceLayoutService } from './WorkspaceLayoutService';
import { ModuleCapabilityRegistry } from './ModuleCapabilityRegistry';

/**
 * Foundation Services Container - Enhanced with Phase 2 Service Communication
 * 
 * Centralizes all persistent services that must survive React re-renders.
 * This is the core of the service layer architecture that isolates
 * foundation resources from UI components.
 * 
 * PHASE 2 ENHANCEMENTS:
 * - Service dependency injection and management
 * - Direct service-to-service communication
 * - Health monitoring and auto-recovery
 * - Performance tracking and optimization
 * 
 * BACKWARD COMPATIBILITY: All existing code continues to work unchanged
 */
export class FoundationServices {
  public readonly eventBus: EventBus;
  public readonly serviceContainer: ServiceContainer;
  
  // Phase 2: Service monitoring and health
  public readonly serviceMonitor: ServiceMonitorImpl;
  
  // Phase 3: Efficiency experts (silent background optimization)
  public readonly performanceMonitor: PerformanceMonitor;
  public readonly usageAnalytics: UsageAnalytics;
  public readonly cacheManager: CacheManager;
  public readonly bottleneckDetector: BottleneckDetector;
  
  // Existing service references (maintained for backward compatibility)
  public readonly webgl: WebGLContextService;
  public readonly webrtc: WebRTCService;
  public readonly workspace: WorkspaceLayoutService;
  public readonly navigation = navigationService;
  public readonly dashboardData = workspaceDataService;
  public readonly integration = integrationService;
  
  // Module capability registry for dynamic module operations
  public readonly moduleCapabilityRegistry: ModuleCapabilityRegistry;

  private static _instance: FoundationServices | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.eventBus = globalEventBus;
    this.serviceContainer = new ServiceContainer(this.eventBus);
    this.serviceMonitor = createServiceMonitor(this.serviceContainer, this.eventBus);
    
    // Phase 3: Deploy all efficiency experts (silent background operation)
    this.performanceMonitor = createPerformanceMonitor(this.eventBus);
    this.usageAnalytics = createUsageAnalytics(this.eventBus);
    this.cacheManager = createCacheManager(this.eventBus);
    this.bottleneckDetector = createBottleneckDetector(this.eventBus, this.performanceMonitor);
    
    // Create existing services (maintained for backward compatibility)
    this.webgl = new WebGLContextService(this.eventBus);
    this.webrtc = new WebRTCService(this.eventBus);
    this.workspace = WorkspaceLayoutService.getInstance(this.eventBus);
    
    // Initialize module capability registry
    this.moduleCapabilityRegistry = new ModuleCapabilityRegistry(this.eventBus);
    
    // Phase 2: Connect navigation service to the communication system
    this.navigation.setServiceContainer(this.serviceContainer);
    
    // Phase 3: Connect services to efficiency experts
    this.workspace.setCacheManager(this.cacheManager);
    
    // Register services with the container for Phase 2 capabilities
    this.registerServicesWithContainer();
    
    console.log('[FoundationServices] 🎯 All efficiency experts deployed and monitoring silently');
  }
  
  /**
   * Register existing services with the new ServiceContainer
   * This creates the "phone directory" without breaking existing functionality
   */
  private registerServicesWithContainer(): void {
    // Note: We're registering existing service instances rather than creating new ones
    // This maintains backward compatibility while adding Phase 2 capabilities
    
    console.log('[FoundationServices] Registering services with container...');
    
    // The existing services will be enhanced to implement IService in future iterations
    // For now, we're just adding the communication infrastructure
  }

  /**
   * Get the singleton instance
   */
  static getInstance(): FoundationServices {
    if (!FoundationServices._instance) {
      FoundationServices._instance = new FoundationServices();
    }
    return FoundationServices._instance;
  }

  /**
   * Initialize all services
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('[FoundationServices] Already initialized');
      return;
    }

    try {
      console.log('[FoundationServices] Initializing foundation services...');
      
      // WebGL service is automatically initialized in constructor
      // Initialize navigation service
      this.navigation.initialize();
      
      // Initialize workspace layout service
      this.workspace.initialize();
      
      // Initialize module capability registry
      await this.moduleCapabilityRegistry.initialize();
      console.log('[FoundationServices] Module capability registry initialized');
      
      // Auto-register default modules
      await this.registerDefaultModules();

      // Phase 2: Start service monitoring (Deploy the security guards)
      this.serviceMonitor.startMonitoring();
      console.log('[FoundationServices] 🛡️ Service health monitoring started');

      this.isInitialized = true;
      
      // Emit to both legacy and new event names during transition
      eventMigrationHelper.emitBoth(
        'foundation:initialized',
        'foundation:system:initialized',
        undefined
      );
      console.log('[FoundationServices] Foundation services initialized successfully');
      
    } catch (error) {
      console.error('[FoundationServices] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * Shutdown all services and clean up resources
   */
  shutdown(): void {
    console.log('[FoundationServices] Shutting down foundation services...');
    
    // Phase 2: Stop service monitoring first
    this.serviceMonitor.stopMonitoring();
    console.log('[FoundationServices] 🛡️ Service monitoring stopped');
    
    this.integration.shutdown();
    this.workspace.shutdown();
    this.webrtc.shutdown();
    this.webgl.shutdown();
    this.eventBus.clear();
    
    this.isInitialized = false;
    FoundationServices._instance = null;
    
    console.log('[FoundationServices] Foundation services shutdown complete');
  }

  /**
   * Phase 2: Direct service communication (The new "phone system")
   * Allows services to talk directly to each other
   */
  async callService<T>(serviceName: string, method: string, params?: any): Promise<T> {
    return this.serviceContainer.call<T>(serviceName, method, params);
  }

  /**
   * Phase 2: Check if a service is available for communication
   */
  isServiceAvailable(serviceName: string): boolean {
    return this.serviceContainer.isServiceAvailable(serviceName);
  }

  /**
   * Phase 2: Get enhanced system health with service communication status
   */
  getEnhancedSystemHealth(): ReturnType<ServiceContainer['getSystemHealth']> {
    return this.serviceContainer.getSystemHealth();
  }

  /**
   * Register default modules with the capability registry
   */
  private async registerDefaultModules(): Promise<void> {
    try {
      // Register the REAL email module that connects to your Gmail API
      const { RealEmailModulePlugin } = await import('@/app/modules/email/RealEmailModulePlugin');
      const realEmailModule = new RealEmailModulePlugin();
      await this.moduleCapabilityRegistry.registerModule(realEmailModule);
      console.log('[FoundationServices] Real Gmail module registered successfully');
      
      // Register the Output module for visual display
      const { OutputModulePlugin } = await import('@/app/modules/output/OutputModulePlugin');
      const outputModule = new OutputModulePlugin();
      await this.moduleCapabilityRegistry.registerModule(outputModule);
      console.log('[FoundationServices] Output module registered successfully');
      
      // The modules will automatically get the userId from the session
      // and use your existing API routes
      
      // Future: Register other modules here
      // const { CalendarModulePlugin } = await import('@/app/modules/calendar/CalendarModulePlugin');
      // const calendarModule = new CalendarModulePlugin();
      // await this.moduleCapabilityRegistry.registerModule(calendarModule);
    } catch (error) {
      console.warn('[FoundationServices] Failed to register some modules:', error);
      // Don't throw - allow system to continue without modules
    }
  }

  /**
   * Phase 3: Get comprehensive performance report from all efficiency experts
   */
  getPerformanceReport(): {
    performance: ReturnType<PerformanceMonitor['getPerformanceReport']>;
    usagePatterns: ReturnType<UsageAnalytics['getLearnedPatterns']>;
    cacheStats: ReturnType<CacheManager['getCacheStats']>;
    bottlenecks: ReturnType<BottleneckDetector['getBottleneckReport']>;
    systemOverview: {
      overallHealthScore: number;
      totalOptimizations: number;
      averageResponseTime: number;
      cacheEfficiency: number;
    };
  } {
    const performanceReport = this.performanceMonitor.getPerformanceReport();
    const usagePatterns = this.usageAnalytics.getLearnedPatterns();
    const cacheStats = this.cacheManager.getCacheStats();
    const bottleneckReport = this.bottleneckDetector.getBottleneckReport();

    // Calculate system overview
    const overallHealthScore = Math.max(0, 100 - (bottleneckReport.activeBottlenecks.critical.length * 25));
    const totalOptimizations = performanceReport.summary.recentOptimizations.length;
    const averageResponseTime = performanceReport.summary.averageResponseTime;
    const cacheEfficiency = cacheStats.hitRate;

    return {
      performance: performanceReport,
      usagePatterns,
      cacheStats,
      bottlenecks: bottleneckReport,
      systemOverview: {
        overallHealthScore,
        totalOptimizations,
        averageResponseTime,
        cacheEfficiency
      }
    };
  }

  /**
   * Get service health status (existing method - maintained for compatibility)
   */
  getHealthStatus(): {
    isInitialized: boolean;
    webgl: ReturnType<WebGLContextService['getStats']>;
    webrtc: {
      status: ReturnType<WebRTCService['getStatus']>;
      hasSession: boolean;
    };
    navigation: {
      sidebarState: string;
      currentSection: string | null;
      contentMode: string;
    };
    dashboardData: {
      metricsCount: number;
      activitiesCount: number;
      systemHealth: string;
    };
    integration: {
      contextTimeOfDay: string;
      smartSuggestionsCount: number;
      performanceMode: string;
      errorRecoveryActive: boolean;
    };
    workspace: {
      activeLayout: string;
      activeModules: number;
      totalModules: number;
    };
    eventBus: {
      totalListeners: number;
    };
  } {
    const dashboardState = this.dashboardData.getState();
    const workspaceState = this.workspace.getState();
    
    return {
      isInitialized: this.isInitialized,
      webgl: this.webgl.getStats(),
      webrtc: {
        status: this.webrtc.getStatus(),
        hasSession: !!this.webrtc.getSession()
      },
      navigation: {
        sidebarState: this.navigation.getSidebarState(),
        currentSection: this.navigation.getCurrentSection(),
        contentMode: this.navigation.getContentMode()
      },
      dashboardData: {
        metricsCount: dashboardState.metrics.length,
        activitiesCount: dashboardState.activities.length,
        systemHealth: dashboardState.summary.systemHealth.overall
      },
      integration: {
        contextTimeOfDay: this.integration.getUserContext().timeOfDay,
        smartSuggestionsCount: this.integration.getSmartSuggestions().length,
        performanceMode: this.integration.getUserPreferences().performanceMode,
        errorRecoveryActive: this.integration.getErrorRecoveryStatus().length > 0
      },
      workspace: {
        activeLayout: workspaceState.activeLayout,
        activeModules: this.workspace.getActiveModules().length,
        totalModules: workspaceState.modules.size
      },
      eventBus: {
        totalListeners: this.eventBus.getListenerCount()
      }
    };
  }
}

// Export singleton instance for convenience
export const foundationServices = FoundationServices.getInstance();