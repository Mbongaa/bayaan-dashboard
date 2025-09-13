// Module capability types based on Module Federation 2.0 patterns
export interface ModuleCapability {
  name: string;
  description: string;
  parameters: {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description: string;
    required: boolean;
    schema?: any; // JSON Schema for complex types
  }[];
  returns: {
    type: string;
    description: string;
    schema?: any;
  };
  examples?: {
    description: string;
    input: Record<string, any>;
    output: any;
  }[];
}

export interface ModuleDescriptor {
  id: string;
  name: string;
  version: string;
  description: string;
  capabilities: ModuleCapability[];
  events?: {
    emits: string[];
    listens: string[];
  };
  permissions?: string[];
}

export interface IModulePlugin {
  descriptor: ModuleDescriptor;
  initialize(services: any): Promise<void>;
  executeOperation(operation: string, params: any): Promise<any>;
  dispose(): Promise<void>;
}

// Additional types for module registry
export interface ModuleRegistrationResult {
  success: boolean;
  moduleId: string;
  error?: string;
}

export interface ModuleOperationResult {
  success: boolean;
  result?: any;
  error?: string;
  moduleId?: string;
  operation?: string;
}

export interface ModuleCapabilityInfo {
  moduleId: string;
  moduleName: string;
  capability: ModuleCapability;
}