/**
 * Lightweight event bus for service-component communication
 * Enables decoupled communication between persistent services and React components
 */
export type EventCallback<T = any> = (data: T) => void;
export type EventUnsubscribe = () => void;

export class EventBus {
  private events: Map<string, Set<EventCallback>> = new Map();

  /**
   * Subscribe to an event
   */
  on<T = any>(event: string, callback: EventCallback<T>): EventUnsubscribe {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    
    this.events.get(event)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.events.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.events.delete(event);
        }
      }
    };
  }

  /**
   * Emit an event to all subscribers
   */
  emit<T = any>(event: string, data?: T): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event callback for "${event}":`, error);
        }
      });
    }
  }

  /**
   * Remove all listeners for an event
   */
  off(event: string): void {
    this.events.delete(event);
  }

  /**
   * Remove all listeners
   */
  clear(): void {
    this.events.clear();
  }

  /**
   * Get number of active listeners for debugging
   */
  getListenerCount(event?: string): number {
    if (event) {
      return this.events.get(event)?.size || 0;
    }
    return Array.from(this.events.values()).reduce((total, set) => total + set.size, 0);
  }
}

// Global event bus instance
export const globalEventBus = new EventBus();