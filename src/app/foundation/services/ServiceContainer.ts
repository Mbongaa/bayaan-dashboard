/**
 * Service Container & Dependency Injection System
 * 
 * This is the "phone directory" system that manages how services find and 
 * communicate with each other. Think of it like a smart building manager
 * that knows which departments need to work together.
 * 
 * PHASE 2: Cross-Service Communication Framework
 * - Service dependency management and resolution
 * - Direct service-to-service communication
 * - Lifecycle management with proper startup order
 * - Health monitoring and auto-recovery integration
 */

import { EventBus } from './EventBus';

/**
 * Service Interface - What every "department" must provide
 */
export interface IService {
  name: string;
  initialize(): Promise<void> | void;
  shutdown(): void;
  getHealth(): ServiceHealth;
}

/**
 * Service Health Status - How we check if a "department" is working well
 */
export interface ServiceHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'recovering';
  uptime: number;
  errorCount: number;
  lastError?: Error;
  metrics: {
    responseTime: number;
    memoryUsage: number;
    eventProcessingRate: number;
  };
  dependencies?: ServiceDependencyHealth[];
}

/**
 * Dependency Health - How we check if services can talk to each other
 */
export interface ServiceDependencyHealth {
  serviceName: string;
  status: 'available' | 'unavailable' | 'degraded';
  lastChecked: Date;
}

/**
 * Service Descriptor - How we describe what each "department" needs
 */
export interface ServiceDescriptor<T extends IService> {
  name: string;
  factory: (container: ServiceContainer) => T;
  dependencies: string[];
  singleton: boolean;
  priority: number; // Higher number = starts first
  autoRestart: boolean;
}

/**
 * Service Communication Interface - The "phone system" between departments
 */
export interface ServiceCommunication {
  // Direct service calls (immediate response)
  call<T>(serviceName: string, method: string, params?: any): Promise<T>;
  
  // Request-response pattern (async operations)
  request<T>(serviceName: string, request: ServiceRequest): Promise<T>;
  
  // Check if a service is available to talk
  isServiceAvailable(serviceName: string): boolean;
  
  // Get a direct reference to another service
  getService<T extends IService>(serviceName: string): T | null;
}

/**
 * Service Request - Structured way for services to ask each other for things
 */
export interface ServiceRequest {
  operation: string;
  params?: any;
  timeout?: number;
  retries?: number;
}

/**
 * Service Container - The "Building Manager" that coordinates everything
 */
export class ServiceContainer implements ServiceCommunication {
  private services = new Map<string, IService>();
  private descriptors = new Map<string, ServiceDescriptor<any>>();
  private serviceInstances = new Map<string, any>();
  private initializationOrder: string[] = [];
  private eventBus: EventBus;
  
  // Health monitoring
  private healthMonitor?: ServiceMonitor;
  private healthCheckInterval?: NodeJS.Timeout;
  
  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  /**
   * Register a service with the container (Add department to phone directory)
   */
  register<T extends IService>(descriptor: ServiceDescriptor<T>): void {
    console.log(`[ServiceContainer] Registering service: ${descriptor.name}`);
    this.descriptors.set(descriptor.name, descriptor);
  }

  /**
   * Get a service instance (Make a phone call to a department)
   */
  get<T extends IService>(name: string): T {
    // Check if already instantiated
    if (this.serviceInstances.has(name)) {
      return this.serviceInstances.get(name);
    }

    const descriptor = this.descriptors.get(name);
    if (!descriptor) {
      throw new Error(`Service ${name} not found. Available services: ${Array.from(this.descriptors.keys()).join(', ')}`);
    }

    // Check dependencies first (Make sure other departments are available)
    for (const depName of descriptor.dependencies) {
      if (!this.serviceInstances.has(depName)) {
        console.log(`[ServiceContainer] Resolving dependency: ${depName} for ${name}`);
        this.get(depName); // Recursive dependency resolution
      }
    }

    // Create the service instance
    console.log(`[ServiceContainer] Creating service instance: ${name}`);
    const instance = descriptor.factory(this);
    
    if (descriptor.singleton) {
      this.serviceInstances.set(name, instance);
    }

    return instance;
  }

  /**
   * Initialize all services in dependency order (Start up the building properly)
   */
  async initialize(): Promise<void> {
    console.log('[ServiceContainer] Starting service initialization...');
    
    // Calculate initialization order based on dependencies and priorities
    this.calculateInitializationOrder();
    
    // Initialize services in order
    for (const serviceName of this.initializationOrder) {
      try {
        console.log(`[ServiceContainer] Initializing service: ${serviceName}`);
        const service = this.get(serviceName);
        await service.initialize();
        console.log(`[ServiceContainer] ✅ Service ${serviceName} initialized successfully`);
      } catch (error) {
        console.error(`[ServiceContainer] ❌ Failed to initialize service ${serviceName}:`, error);
        throw error;
      }
    }
    
    // Start health monitoring
    this.startHealthMonitoring();
    
    // Notify that all services are ready
    this.eventBus.emitTyped('foundation:system:initialized', undefined);
    console.log('[ServiceContainer] 🎉 All services initialized successfully');
  }

  /**
   * Calculate the order to start services based on dependencies
   */
  private calculateInitializationOrder(): void {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const order: string[] = [];

    const visit = (serviceName: string) => {
      if (visited.has(serviceName)) return;
      if (visiting.has(serviceName)) {
        throw new Error(`Circular dependency detected involving service: ${serviceName}`);
      }

      visiting.add(serviceName);
      const descriptor = this.descriptors.get(serviceName);
      
      if (descriptor) {
        // Visit dependencies first
        for (const dep of descriptor.dependencies) {
          visit(dep);
        }
        
        order.push(serviceName);
      }
      
      visiting.delete(serviceName);
      visited.add(serviceName);
    };

    // Visit all registered services
    Array.from(this.descriptors.keys()).forEach(visit);
    
    // Sort by priority (higher priority starts first)
    order.sort((a, b) => {
      const aPriority = this.descriptors.get(a)?.priority || 0;
      const bPriority = this.descriptors.get(b)?.priority || 0;
      return bPriority - aPriority;
    });

    this.initializationOrder = order;
    console.log('[ServiceContainer] Initialization order calculated:', order);
  }

  /**
   * Direct service call (Make a direct phone call)
   */
  async call<T>(serviceName: string, method: string, params?: any): Promise<T> {
    const service = this.get(serviceName);
    if (!service || typeof (service as any)[method] !== 'function') {
      throw new Error(`Method ${method} not found on service ${serviceName}`);
    }

    try {
      const result = await (service as any)[method](params);
      return result;
    } catch (error) {
      console.error(`[ServiceContainer] Error calling ${serviceName}.${method}:`, error);
      throw error;
    }
  }

  /**
   * Service request pattern (Send a formal request)
   */
  async request<T>(serviceName: string, request: ServiceRequest): Promise<T> {
    const timeout = request.timeout || 5000;
    const retries = request.retries || 3;
    
    let lastError: Error;
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const result = await Promise.race([
          this.call<T>(serviceName, request.operation, request.params),
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), timeout)
          )
        ]);
        
        return result;
      } catch (error) {
        lastError = error as Error;
        console.warn(`[ServiceContainer] Request to ${serviceName} failed (attempt ${attempt + 1}/${retries}):`, error);
        
        if (attempt < retries - 1) {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }
    
    throw lastError!;
  }

  /**
   * Check if a service is available (Is the department answering their phone?)
   */
  isServiceAvailable(serviceName: string): boolean {
    try {
      const service = this.get(serviceName);
      const health = service.getHealth();
      return health.status === 'healthy' || health.status === 'degraded';
    } catch {
      return false;
    }
  }

  /**
   * Get direct service reference (Get direct access to a department)
   */
  getService<T extends IService>(serviceName: string): T | null {
    try {
      return this.get<T>(serviceName);
    } catch {
      return null;
    }
  }

  /**
   * Start health monitoring (Deploy the building security guards)
   */
  private startHealthMonitoring(): void {
    this.healthCheckInterval = setInterval(() => {
      this.checkAllServicesHealth();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Check health of all services
   */
  private checkAllServicesHealth(): void {
    for (const [serviceName] of this.serviceInstances) {
      try {
        const service = this.get(serviceName);
        const health = service.getHealth();
        
        if (health.status === 'unhealthy') {
          console.warn(`[ServiceContainer] Service ${serviceName} is unhealthy:`, health);
          this.eventBus.emitTyped('integration:error:alert', {
            service: serviceName,
            health: health,
            timestamp: new Date()
          });
        }
      } catch (error) {
        console.error(`[ServiceContainer] Error checking health of ${serviceName}:`, error);
      }
    }
  }

  /**
   * Get system-wide health status
   */
  getSystemHealth(): {
    overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    services: ServiceHealth[];
    totalServices: number;
    healthyServices: number;
  } {
    const healthStatuses: ServiceHealth[] = [];
    let healthyCount = 0;

    for (const [serviceName] of this.serviceInstances) {
      try {
        const service = this.get(serviceName);
        const health = service.getHealth();
        healthStatuses.push(health);
        
        if (health.status === 'healthy') {
          healthyCount++;
        }
      } catch (error) {
        healthStatuses.push({
          name: serviceName,
          status: 'unhealthy',
          uptime: 0,
          errorCount: 1,
          lastError: error as Error,
          metrics: { responseTime: 0, memoryUsage: 0, eventProcessingRate: 0 }
        });
      }
    }

    const totalServices = healthStatuses.length;
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (healthyCount === 0) {
      overallStatus = 'unhealthy';
    } else if (healthyCount < totalServices * 0.8) {
      overallStatus = 'degraded';
    }

    return {
      overallStatus,
      services: healthStatuses,
      totalServices,
      healthyServices: healthyCount
    };
  }

  /**
   * Shutdown all services in reverse order
   */
  async shutdown(): Promise<void> {
    console.log('[ServiceContainer] Starting service shutdown...');
    
    // Stop health monitoring
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    // Shutdown in reverse order
    const shutdownOrder = [...this.initializationOrder].reverse();
    
    for (const serviceName of shutdownOrder) {
      try {
        console.log(`[ServiceContainer] Shutting down service: ${serviceName}`);
        const service = this.get(serviceName);
        service.shutdown();
        console.log(`[ServiceContainer] ✅ Service ${serviceName} shut down successfully`);
      } catch (error) {
        console.error(`[ServiceContainer] ❌ Error shutting down service ${serviceName}:`, error);
      }
    }
    
    this.serviceInstances.clear();
    console.log('[ServiceContainer] 🏁 All services shut down');
  }
}

/**
 * Service Monitor - The "Security Guards" for service health
 */
export interface ServiceMonitor {
  registerHealthCheck(serviceName: string, check: () => Promise<ServiceHealth>): void;
  startMonitoring(interval?: number): void;
  stopMonitoring(): void;
  getSystemHealth(): Promise<SystemHealth>;
  attemptRecovery(serviceName: string): Promise<boolean>;
}

/**
 * System Health - Overall building health status
 */
export interface SystemHealth {
  overallStatus: 'healthy' | 'degraded' | 'critical';
  timestamp: Date;
  services: ServiceHealth[];
  alerts: HealthAlert[];
  recommendations: string[];
}

/**
 * Health Alert - Problems that need attention
 */
export interface HealthAlert {
  severity: 'info' | 'warning' | 'critical';
  service: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
}