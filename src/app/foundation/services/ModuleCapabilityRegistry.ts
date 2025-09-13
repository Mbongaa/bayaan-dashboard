import { EventBus } from './EventBus';
import { 
  IModulePlugin, 
  ModuleDescriptor, 
  ModuleCapability,
  ModuleOperationResult,
  ModuleRegistrationResult 
} from '../types/ModuleTypes';

export class ModuleCapabilityRegistry {
  private modules: Map<string, IModulePlugin> = new Map();
  private capabilities: Map<string, ModuleCapability & { moduleId: string }> = new Map();
  private eventBus: EventBus;
  private initialized = false;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    console.log('[ModuleRegistry] Initializing module capability registry');
    
    // Set up event listeners for module lifecycle
    this.eventBus.on('module:registering', this.handleModuleRegistering.bind(this));
    this.eventBus.on('module:operation:request', this.handleOperationRequest.bind(this));
    
    this.initialized = true;
    this.eventBus.emit('module:registry:ready', {});
  }

  async registerModule(module: IModulePlugin): Promise<ModuleRegistrationResult> {
    try {
      const { id, name, capabilities } = module.descriptor;
      
      console.log(`[ModuleRegistry] Registering module: ${name} (${id})`);
      
      // Check if module already exists
      if (this.modules.has(id)) {
        console.warn(`[ModuleRegistry] Module ${id} already registered, updating...`);
      }
      
      // Store module reference
      this.modules.set(id, module);
      
      // Register capabilities with fully qualified names
      capabilities.forEach(capability => {
        const qualifiedName = `${id}.${capability.name}`;
        this.capabilities.set(qualifiedName, {
          ...capability,
          moduleId: id
        });
        
        console.log(`[ModuleRegistry] Registered capability: ${qualifiedName}`);
      });
      
      // Initialize the module with foundation services
      await module.initialize(this.getFoundationServices());
      
      // Emit registration event
      this.eventBus.emit('module:registered', {
        moduleId: id,
        name,
        capabilityCount: capabilities.length
      });
      
      return {
        success: true,
        moduleId: id
      };
    } catch (error) {
      console.error('[ModuleRegistry] Registration failed:', error);
      return {
        success: false,
        moduleId: module.descriptor.id,
        error: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  }

  async unregisterModule(moduleId: string): Promise<void> {
    const module = this.modules.get(moduleId);
    if (!module) {
      console.warn(`[ModuleRegistry] Module ${moduleId} not found for unregistration`);
      return;
    }

    // Dispose the module
    await module.dispose();

    // Remove capabilities
    const capabilitiesToRemove: string[] = [];
    this.capabilities.forEach((capability, key) => {
      if (capability.moduleId === moduleId) {
        capabilitiesToRemove.push(key);
      }
    });
    capabilitiesToRemove.forEach(key => this.capabilities.delete(key));

    // Remove module
    this.modules.delete(moduleId);

    console.log(`[ModuleRegistry] Unregistered module: ${moduleId}`);
  }

  async executeOperation(
    moduleId: string,
    operation: string,
    params: any
  ): Promise<ModuleOperationResult> {
    try {
      const module = this.modules.get(moduleId);
      if (!module) {
        return {
          success: false,
          error: `Module not found: ${moduleId}`,
          moduleId,
          operation
        };
      }

      const qualifiedName = `${moduleId}.${operation}`;
      const capability = this.capabilities.get(qualifiedName);
      
      if (!capability) {
        const availableOps = this.getModuleCapabilities(moduleId).map(c => c.name);
        return {
          success: false,
          error: `Operation not found: ${operation}. Available operations: ${availableOps.join(', ')}`,
          moduleId,
          operation
        };
      }

      // Validate parameters
      const validationError = this.validateParameters(capability, params);
      if (validationError) {
        return {
          success: false,
          error: validationError,
          moduleId,
          operation
        };
      }
      
      console.log(`[ModuleRegistry] Executing: ${qualifiedName}`, params);
      
      // Emit operation start event
      this.eventBus.emit('module:operation:started', {
        moduleId,
        operation,
        params
      });
      
      // Execute operation
      const result = await module.executeOperation(operation, params);
      
      // Emit completion event
      this.eventBus.emit('module:operation:completed', {
        moduleId,
        operation,
        success: true
      });
      
      return {
        success: true,
        result,
        moduleId,
        operation
      };
    } catch (error) {
      console.error(`[ModuleRegistry] Operation failed:`, error);
      
      this.eventBus.emit('module:operation:failed', {
        moduleId,
        operation,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Operation failed',
        moduleId,
        operation
      };
    }
  }

  getAvailableModules(): ModuleDescriptor[] {
    return Array.from(this.modules.values()).map(m => m.descriptor);
  }

  getModuleCapabilities(moduleId: string): ModuleCapability[] {
    const module = this.modules.get(moduleId);
    return module ? module.descriptor.capabilities : [];
  }

  getAllCapabilities(): Array<ModuleCapability & { moduleId: string; moduleName: string }> {
    const result: Array<ModuleCapability & { moduleId: string; moduleName: string }> = [];
    
    this.capabilities.forEach((capability) => {
      const module = this.modules.get(capability.moduleId);
      if (module) {
        result.push({
          ...capability,
          moduleName: module.descriptor.name
        });
      }
    });
    
    return result;
  }

  getModuleById(moduleId: string): IModulePlugin | undefined {
    return this.modules.get(moduleId);
  }

  hasModule(moduleId: string): boolean {
    return this.modules.has(moduleId);
  }

  private validateParameters(capability: ModuleCapability, params: any): string | null {
    // Check if params is an object
    if (typeof params !== 'object' || params === null) {
      return 'Parameters must be an object';
    }

    // Check required parameters
    for (const param of capability.parameters) {
      if (param.required && !(param.name in params)) {
        return `Missing required parameter: ${param.name}`;
      }
      
      // Type validation
      if (param.name in params) {
        const value = params[param.name];
        const valueType = Array.isArray(value) ? 'array' : typeof value;
        
        if (valueType !== param.type && param.type !== 'object') {
          // Allow object type to be more flexible
          if (!(param.type === 'object' && typeof value === 'object')) {
            return `Invalid type for ${param.name}: expected ${param.type}, got ${valueType}`;
          }
        }
      }
    }
    
    return null;
  }

  private getFoundationServices(): any {
    // Return a reference to foundation services that modules can use
    return {
      eventBus: this.eventBus,
      // Additional services can be added here as needed
    };
  }

  private handleModuleRegistering(event: any): void {
    console.log('[ModuleRegistry] Module registering event:', event);
  }

  private async handleOperationRequest(event: any): Promise<void> {
    const { moduleId, operation, params, requestId } = event;
    
    const result = await this.executeOperation(moduleId, operation, params);
    
    this.eventBus.emit('module:operation:response', {
      requestId,
      ...result
    });
  }

  // Utility method to get a summary of the registry state
  getRegistryStatus(): {
    moduleCount: number;
    capabilityCount: number;
    modules: Array<{ id: string; name: string; version: string; capabilityCount: number }>;
  } {
    const modules = Array.from(this.modules.values()).map(m => ({
      id: m.descriptor.id,
      name: m.descriptor.name,
      version: m.descriptor.version,
      capabilityCount: m.descriptor.capabilities.length
    }));

    return {
      moduleCount: this.modules.size,
      capabilityCount: this.capabilities.size,
      modules
    };
  }
}