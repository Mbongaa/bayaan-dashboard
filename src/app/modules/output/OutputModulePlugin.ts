import { 
  IModulePlugin, 
  ModuleDescriptor 
} from '@/app/foundation/types/ModuleTypes';
import { EventBus } from '@/app/foundation/services/EventBus';

/**
 * Output Module Plugin for displaying VA results visually
 * Acts as a visual notepad for content better suited for display than voice
 */
export class OutputModulePlugin implements IModulePlugin {
  private eventBus: EventBus | null = null;
  private userId: string | null = null;
  private currentContent: any = null;
  private contentHistory: any[] = [];
  
  descriptor: ModuleDescriptor = {
    id: 'output',
    name: 'Output Panel',
    version: '1.0.0',
    description: 'Visual display for VA results, translations, and formatted content',
    capabilities: [
      {
        name: 'displayText',
        description: 'Display plain text content with typewriter animation',
        parameters: [
          {
            name: 'content',
            type: 'string',
            description: 'Text content to display',
            required: true
          },
          {
            name: 'title',
            type: 'string',
            description: 'Optional title for the content',
            required: false
          }
        ],
        returns: {
          type: 'object',
          description: 'Display confirmation'
        }
      },
      {
        name: 'displayTranslation',
        description: 'Display translated content with original and translated versions',
        parameters: [
          {
            name: 'original',
            type: 'object',
            description: 'Original text and language',
            required: true
          },
          {
            name: 'translated',
            type: 'object',
            description: 'Translated text and language',
            required: true
          },
          {
            name: 'metadata',
            type: 'object',
            description: 'Additional metadata',
            required: false
          }
        ],
        returns: {
          type: 'object',
          description: 'Display confirmation'
        }
      },
      {
        name: 'clear',
        description: 'Clear the output display',
        parameters: [],
        returns: {
          type: 'object',
          description: 'Clear confirmation'
        }
      },
      {
        name: 'append',
        description: 'Append content to existing display',
        parameters: [
          {
            name: 'content',
            type: 'string',
            description: 'Content to append',
            required: true
          }
        ],
        returns: {
          type: 'object',
          description: 'Append confirmation'
        }
      },
      {
        name: 'getState',
        description: 'Get current output module state',
        parameters: [],
        returns: {
          type: 'object',
          description: 'Current module state'
        }
      }
    ],
    events: {
      emits: [
        'output:displayed',
        'output:cleared',
        'output:appended',
        'output:translation:displayed'
      ],
      listens: [
        'output:clear',
        'output:refresh'
      ]
    }
  };

  async initialize(services: any): Promise<void> {
    console.log('[OutputModule] Initializing');
    
    this.eventBus = services.eventBus;
    this.userId = services.userId || await this.getCurrentUserId();
    
    // Set up event listeners
    if (this.eventBus) {
      this.eventBus.on('output:clear', this.handleClear);
      this.eventBus.on('output:refresh', this.handleRefresh);
    }
    
    console.log('[OutputModule] Initialized with userId:', this.userId);
  }

  async executeOperation(operation: string, params: any): Promise<any> {
    console.log('[OutputModule] Executing operation:', operation, params);
    
    switch (operation) {
      case 'displayText':
        return this.displayText(params);
      
      case 'displayTranslation':
        return this.displayTranslation(params);
      
      case 'clear':
        return this.clear();
      
      case 'append':
        return this.appendContent(params);
      
      case 'getState':
        return this.getState();
      
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  private async displayText(params: any): Promise<any> {
    const { content, title } = params;
    
    try {
      this.currentContent = {
        type: 'text',
        content,
        title,
        timestamp: Date.now()
      };
      
      // Add to history
      this.contentHistory.push(this.currentContent);
      
      // Emit event for UI update
      this.emitToUI('output:operation', {
        operation: 'displayText',
        params: this.currentContent
      });
      
      this.eventBus!.emit('output:displayed', {
        type: 'text',
        contentLength: content.length
      });
      
      return {
        success: true,
        message: 'Content displayed in output panel'
      };
    } catch (error) {
      console.error('[OutputModule] Display text failed:', error);
      throw error;
    }
  }

  private async displayTranslation(params: any): Promise<any> {
    const { original, translated, metadata } = params;
    
    try {
      // Mock translation for now - in production, integrate with real translation API
      const translatedText = translated.text || await this.mockTranslate(original.text, translated.language);
      
      this.currentContent = {
        type: 'translation',
        original: {
          text: original.text,
          language: original.language || 'en'
        },
        translated: {
          text: translatedText,
          language: translated.language || 'es'
        },
        metadata: metadata || {},
        timestamp: Date.now()
      };
      
      // Add to history
      this.contentHistory.push(this.currentContent);
      
      // Emit event for UI update
      this.emitToUI('output:operation', {
        operation: 'displayTranslation',
        params: this.currentContent
      });
      
      this.eventBus!.emit('output:translation:displayed', {
        sourceLanguage: original.language,
        targetLanguage: translated.language,
        originalLength: original.text.length,
        translatedLength: translatedText.length
      });
      
      return {
        success: true,
        message: 'Translation displayed in output panel',
        translated: translatedText
      };
    } catch (error) {
      console.error('[OutputModule] Display translation failed:', error);
      throw error;
    }
  }

  private async clear(): Promise<any> {
    try {
      this.currentContent = null;
      
      // Emit event for UI update
      this.emitToUI('output:operation', {
        operation: 'clear',
        params: {}
      });
      
      this.eventBus!.emit('output:cleared', {
        timestamp: Date.now()
      });
      
      return {
        success: true,
        message: 'Output panel cleared'
      };
    } catch (error) {
      console.error('[OutputModule] Clear failed:', error);
      throw error;
    }
  }

  private async appendContent(params: any): Promise<any> {
    const { content } = params;
    
    try {
      if (this.currentContent && this.currentContent.type === 'text') {
        this.currentContent.content += '\n' + content;
      } else {
        // If no current content or not text type, create new text content
        this.currentContent = {
          type: 'text',
          content,
          timestamp: Date.now()
        };
      }
      
      // Emit event for UI update
      this.emitToUI('output:operation', {
        operation: 'append',
        params: { content }
      });
      
      this.eventBus!.emit('output:appended', {
        contentLength: content.length
      });
      
      return {
        success: true,
        message: 'Content appended to output panel'
      };
    } catch (error) {
      console.error('[OutputModule] Append failed:', error);
      throw error;
    }
  }

  private async getState(): Promise<any> {
    return {
      success: true,
      hasContent: this.currentContent !== null,
      contentType: this.currentContent?.type || null,
      historyCount: this.contentHistory.length,
      currentContent: this.currentContent
    };
  }

  /**
   * Mock translation function for testing
   * Replace with real translation API in production
   */
  private async mockTranslate(text: string, targetLanguage: string): Promise<string> {
    // Simple mock translation - just adds language prefix
    const translations: Record<string, string> = {
      'es': '[Spanish Translation] ',
      'fr': '[French Translation] ',
      'de': '[German Translation] ',
      'ja': '[Japanese Translation] ',
      'zh': '[Chinese Translation] ',
    };
    
    const prefix = translations[targetLanguage] || '[Translation] ';
    
    // For demo, we'll do a simple transformation
    // In production, use Google Translate API or similar
    return prefix + text;
  }

  /**
   * Emit event to UI components via window
   */
  private emitToUI(eventName: string, detail: any): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(eventName, {
        detail,
        bubbles: true,
        cancelable: true
      }));
    }
  }

  private async getCurrentUserId(): Promise<string | null> {
    try {
      const { createClient } = await import('@/app/utils/supabase/client');
      const supabase = createClient();
      
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('[OutputModule] Error getting user:', error);
        return null;
      }
      
      if (user) {
        console.log('[OutputModule] Got userId:', user.id);
        return user.id;
      }
    } catch (error) {
      console.error('[OutputModule] Failed to get userId:', error);
    }
    return null;
  }

  private handleClear = async (): Promise<void> => {
    console.log('[OutputModule] Handling clear event');
    await this.clear();
  }

  private handleRefresh = async (): Promise<void> => {
    console.log('[OutputModule] Handling refresh event');
    // Re-emit current content to refresh UI
    if (this.currentContent) {
      this.emitToUI('output:operation', {
        operation: 'refresh',
        params: this.currentContent
      });
    }
  }

  async dispose(): Promise<void> {
    console.log('[OutputModule] Disposing');
    
    if (this.eventBus) {
      this.eventBus.off('output:clear');
      this.eventBus.off('output:refresh');
    }
    
    this.eventBus = null;
    this.userId = null;
    this.currentContent = null;
    this.contentHistory = [];
  }
}