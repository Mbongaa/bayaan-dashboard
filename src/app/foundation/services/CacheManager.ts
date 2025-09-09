/**
 * CacheManager - The "Memory Optimization Expert"
 * 
 * This silent background system manages memory and caching:
 * - Caches frequently used layout calculations
 * - Pre-loads commonly used modules and configurations
 * - Automatically cleans up unused cached data
 * - Optimizes memory usage patterns
 * 
 * IMPORTANT: This is NOT a voice agent - it's invisible infrastructure
 * that optimizes memory but never talks to users or appears in conversations.
 * 
 * PHASE 3: Performance & Observability
 * - Smart caching of expensive operations
 * - Memory usage optimization
 * - Predictive resource pre-loading
 * - Automatic cache cleanup and management
 */

import { Layout } from 'react-grid-layout';
import { EventBus } from './EventBus';

/**
 * Cache Item - Something stored in memory for faster access
 */
export interface CacheItem<T = any> {
  key: string;
  data: T;
  timestamp: Date;
  accessCount: number;
  lastAccessed: Date;
  size: number;             // Estimated memory size in bytes
  ttl?: number;            // Time to live (optional expiration)
  priority: 'high' | 'medium' | 'low';
}

/**
 * Cache Statistics - What the memory expert learned
 */
export interface CacheStats {
  totalItems: number;
  totalMemoryUsage: number;
  hitRate: number;          // Percentage of requests served from cache
  missRate: number;         // Percentage of requests that needed computation
  topItems: Array<{
    key: string;
    accessCount: number;
    lastAccessed: Date;
  }>;
  memoryDistribution: {
    highPriority: number;
    mediumPriority: number; 
    lowPriority: number;
  };
}

/**
 * Layout Cache Entry - Cached layout calculations
 */
export interface LayoutCacheEntry {
  proportions: number[];
  layouts: Layout[];
  panelCount: number;
  rows: number;
  layoutPattern: string;
  calculationTime: number;  // How long the original calculation took
}

/**
 * Pre-load Request - What to prepare in advance
 */
export interface PreloadRequest {
  resource: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedBenefit: number; // Expected time savings in milliseconds
}

/**
 * CacheManager Implementation - The Silent Memory Optimization Expert
 */
export class CacheManager {
  private cache = new Map<string, CacheItem>();
  private eventBus: EventBus;
  private maxMemoryUsage = 50 * 1024 * 1024; // 50MB limit
  private currentMemoryUsage = 0;
  
  // Access tracking for intelligent cache management
  private accessLog = new Map<string, { hits: number; misses: number }>();
  private cleanupInterval?: NodeJS.Timeout;

  // Special caches for common operations
  private layoutCache = new Map<string, LayoutCacheEntry>();
  private voiceCommandCache = new Map<string, any>();

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.setupAutomaticCaching();
    this.startPeriodicCleanup();
    console.log('[CacheManager] 🧠 Memory optimization expert deployed (silent operation)');
  }

  /**
   * Get item from cache (Check if we already have this calculated)
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      // Cache miss
      const accessInfo = this.accessLog.get(key) || { hits: 0, misses: 0 };
      accessInfo.misses++;
      this.accessLog.set(key, accessInfo);
      return null;
    }

    // Check if expired
    if (item.ttl && Date.now() - item.timestamp.getTime() > item.ttl) {
      this.remove(key);
      return null;
    }

    // Cache hit - update access info
    item.accessCount++;
    item.lastAccessed = new Date();
    
    const accessInfo = this.accessLog.get(key) || { hits: 0, misses: 0 };
    accessInfo.hits++;
    this.accessLog.set(key, accessInfo);

    return item.data as T;
  }

  /**
   * Store item in cache (Save calculation results for next time)
   */
  set<T>(key: string, data: T, options: {
    ttl?: number;
    priority?: 'high' | 'medium' | 'low';
    estimatedSize?: number;
  } = {}): void {
    const estimatedSize = options.estimatedSize || this.estimateDataSize(data);
    
    // Check memory limits
    if (this.currentMemoryUsage + estimatedSize > this.maxMemoryUsage) {
      this.performIntelligentCleanup(estimatedSize);
    }

    const cacheItem: CacheItem<T> = {
      key,
      data,
      timestamp: new Date(),
      accessCount: 0,
      lastAccessed: new Date(),
      size: estimatedSize,
      ttl: options.ttl,
      priority: options.priority || 'medium'
    };

    // Remove old item if exists
    if (this.cache.has(key)) {
      this.currentMemoryUsage -= this.cache.get(key)!.size;
    }

    this.cache.set(key, cacheItem);
    this.currentMemoryUsage += estimatedSize;

    console.log(`[CacheManager] 💾 Cached "${key}" (${estimatedSize} bytes, total: ${(this.currentMemoryUsage/1024/1024).toFixed(1)}MB)`);
  }

  /**
   * Cache layout calculations (Speed up custom layouts like "70/30", "25/25/25/25")
   */
  cacheLayoutCalculation(
    proportions: number[], 
    layoutPattern: string, 
    rows: number, 
    layouts: Layout[],
    calculationTime: number
  ): void {
    const key = `layout:${proportions.join('-')}:${layoutPattern}:${rows}`;
    
    const cacheEntry: LayoutCacheEntry = {
      proportions,
      layouts,
      panelCount: proportions.length,
      rows,
      layoutPattern,
      calculationTime
    };

    this.set(key, cacheEntry, {
      priority: 'high', // Layout calculations are important for voice commands
      ttl: 24 * 60 * 60 * 1000, // Cache for 24 hours
      estimatedSize: layouts.length * 200 // Estimate ~200 bytes per layout item
    });
  }

  /**
   * Get cached layout calculation (Skip expensive calculations if we did them before)
   */
  getCachedLayout(proportions: number[], layoutPattern: string, rows: number): LayoutCacheEntry | null {
    const key = `layout:${proportions.join('-')}:${layoutPattern}:${rows}`;
    return this.get<LayoutCacheEntry>(key);
  }

  /**
   * Setup automatic caching based on usage patterns
   */
  private setupAutomaticCaching(): void {
    // Cache workspace layout results automatically
    this.eventBus.onTyped('workspace:layout:changed', (data) => {
      if (data.proportions && data.layouts) {
        this.cacheLayoutCalculation(
          data.proportions,
          data.layoutPattern || 'horizontal',
          data.rows || 1,
          data.layouts,
          50 // Estimated calculation time saved
        );
      }
    });

    // Cache frequently accessed navigation states
    this.eventBus.onTyped('navigation:section:changed', (data) => {
      const key = `nav-state:${data.section}:${data.contentMode}`;
      this.set(key, data, {
        priority: 'medium',
        ttl: 60 * 60 * 1000, // 1 hour
        estimatedSize: 100
      });
    });

    console.log('[CacheManager] 🔄 Automatic caching setup complete');
  }

  /**
   * Intelligent cache cleanup (Smart memory management)
   */
  private performIntelligentCleanup(neededSpace: number): void {
    console.log('[CacheManager] 🧹 Performing intelligent cache cleanup...');

    // Strategy: Remove items in this order:
    // 1. Expired items
    // 2. Low priority items that haven't been accessed recently
    // 3. Items with low access count
    // 4. Oldest items (if still need space)

    const itemsToRemove: string[] = [];
    let spaceToFree = neededSpace * 1.5; // Free extra space for future items

    // Step 1: Remove expired items
    const now = Date.now();
    for (const [key, item] of this.cache) {
      if (item.ttl && now - item.timestamp.getTime() > item.ttl) {
        itemsToRemove.push(key);
        spaceToFree -= item.size;
      }
    }

    // Step 2: Remove low priority, rarely accessed items
    if (spaceToFree > 0) {
      const lowPriorityItems = Array.from(this.cache.entries())
        .filter(([key]) => !itemsToRemove.includes(key))
        .filter(([, item]) => item.priority === 'low' && item.accessCount < 3)
        .sort(([, a], [, b]) => a.lastAccessed.getTime() - b.lastAccessed.getTime());

      for (const [key, item] of lowPriorityItems) {
        if (spaceToFree <= 0) break;
        itemsToRemove.push(key);
        spaceToFree -= item.size;
      }
    }

    // Step 3: Remove items with low access count
    if (spaceToFree > 0) {
      const lowAccessItems = Array.from(this.cache.entries())
        .filter(([key]) => !itemsToRemove.includes(key))
        .sort(([, a], [, b]) => a.accessCount - b.accessCount);

      for (const [key, item] of lowAccessItems) {
        if (spaceToFree <= 0) break;
        itemsToRemove.push(key);
        spaceToFree -= item.size;
      }
    }

    // Actually remove the items
    itemsToRemove.forEach(key => this.remove(key));

    console.log(`[CacheManager] 🧹 Cleaned up ${itemsToRemove.length} cache items, freed ${(neededSpace/1024).toFixed(1)}KB`);
  }

  /**
   * Remove item from cache
   */
  remove(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    this.cache.delete(key);
    this.currentMemoryUsage -= item.size;
    return true;
  }

  /**
   * Estimate data size for cache management
   */
  private estimateDataSize(data: any): number {
    try {
      return JSON.stringify(data).length * 2; // Rough estimate: 2 bytes per character
    } catch {
      return 1000; // Default estimate if can't serialize
    }
  }

  /**
   * Start periodic cleanup
   */
  private startPeriodicCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.performIntelligentCleanup(0); // Regular maintenance
    }, 10 * 60 * 1000); // Every 10 minutes
  }

  /**
   * Get cache statistics (for debugging and monitoring)
   */
  getCacheStats(): CacheStats {
    const totalItems = this.cache.size;
    const totalHits = Array.from(this.accessLog.values()).reduce((sum, log) => sum + log.hits, 0);
    const totalMisses = Array.from(this.accessLog.values()).reduce((sum, log) => sum + log.misses, 0);
    const totalRequests = totalHits + totalMisses;

    const hitRate = totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;
    const missRate = 100 - hitRate;

    const topItems = Array.from(this.cache.values())
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10)
      .map(item => ({
        key: item.key,
        accessCount: item.accessCount,
        lastAccessed: item.lastAccessed
      }));

    const memoryDistribution = {
      highPriority: 0,
      mediumPriority: 0,
      lowPriority: 0
    };

    for (const item of this.cache.values()) {
      if (item.priority === 'high') memoryDistribution.highPriority += item.size;
      else if (item.priority === 'medium') memoryDistribution.mediumPriority += item.size;
      else memoryDistribution.lowPriority += item.size;
    }

    return {
      totalItems,
      totalMemoryUsage: this.currentMemoryUsage,
      hitRate,
      missRate,
      topItems,
      memoryDistribution
    };
  }

  /**
   * Pre-load resources based on usage patterns
   */
  preloadResources(requests: PreloadRequest[]): void {
    console.log(`[CacheManager] 🚀 Pre-loading ${requests.length} resources...`);

    requests.forEach(request => {
      // Pre-load based on resource type
      if (request.resource.startsWith('layout:')) {
        this.preloadLayoutCalculations(request);
      } else if (request.resource.startsWith('module:')) {
        this.preloadModuleData(request);
      }
    });
  }

  /**
   * Pre-load layout calculations for common patterns
   */
  private preloadLayoutCalculations(request: PreloadRequest): void {
    // Pre-calculate common layout patterns
    const commonLayouts = [
      { proportions: [70, 30], pattern: 'horizontal' },
      { proportions: [60, 40], pattern: 'horizontal' },
      { proportions: [50, 50], pattern: 'horizontal' },
      { proportions: [25, 25, 25, 25], pattern: 'grid' }
    ];

    commonLayouts.forEach(layout => {
      const key = `layout:${layout.proportions.join('-')}:${layout.pattern}:1`;
      
      if (!this.cache.has(key)) {
        // Simulate layout calculation (in real implementation, this would call the actual calculation)
        const simulatedLayouts: Layout[] = layout.proportions.map((width, i) => ({
          i: `module-${i + 1}`,
          x: i * (12 / layout.proportions.length),
          y: 0,
          w: Math.round((width / 100) * 12),
          h: 12,
          minW: 1,
          minH: 2
        }));

        const cacheEntry: LayoutCacheEntry = {
          proportions: layout.proportions,
          layouts: simulatedLayouts,
          panelCount: layout.proportions.length,
          rows: 1,
          layoutPattern: layout.pattern,
          calculationTime: 50
        };

        this.set(key, cacheEntry, {
          priority: 'high',
          ttl: 24 * 60 * 60 * 1000, // 24 hours
          estimatedSize: simulatedLayouts.length * 200
        });
      }
    });
  }

  /**
   * Pre-load module data
   */
  private preloadModuleData(request: PreloadRequest): void {
    // Pre-load common module configurations
    const moduleType = request.resource.split(':')[1];
    const key = `module-config:${moduleType}`;

    if (!this.cache.has(key)) {
      const moduleConfig = {
        type: moduleType,
        defaultSettings: {},
        preloadTime: Date.now()
      };

      this.set(key, moduleConfig, {
        priority: 'medium',
        ttl: 60 * 60 * 1000, // 1 hour
        estimatedSize: 500
      });
    }
  }

  /**
   * Get cache optimization recommendations
   */
  getOptimizationRecommendations(): Array<{
    type: 'memory' | 'performance' | 'cleanup';
    priority: 'high' | 'medium' | 'low';
    description: string;
    action: string;
    estimatedBenefit: string;
  }> {
    const recommendations = [];
    const stats = this.getCacheStats();

    // Memory usage recommendations
    if (this.currentMemoryUsage > this.maxMemoryUsage * 0.8) {
      recommendations.push({
        type: 'memory' as const,
        priority: 'high' as const,
        description: 'Memory usage is high (>80% of limit)',
        action: 'Increase cache cleanup frequency or reduce cache size',
        estimatedBenefit: 'Prevent memory-related slowdowns'
      });
    }

    // Performance recommendations
    if (stats.hitRate < 50) {
      recommendations.push({
        type: 'performance' as const,
        priority: 'medium' as const,
        description: `Low cache hit rate (${stats.hitRate.toFixed(1)}%)`,
        action: 'Improve caching strategy or increase cache retention',
        estimatedBenefit: 'Faster response times for repeated operations'
      });
    }

    // Cleanup recommendations
    const unusedItems = Array.from(this.cache.values()).filter(item => 
      item.accessCount === 0 && 
      Date.now() - item.timestamp.getTime() > 60 * 60 * 1000 // Unused for 1 hour
    );

    if (unusedItems.length > 10) {
      recommendations.push({
        type: 'cleanup' as const,
        priority: 'low' as const,
        description: `${unusedItems.length} unused cache items detected`,
        action: 'Clean up unused cached data',
        estimatedBenefit: 'Free memory for more important operations'
      });
    }

    return recommendations;
  }


  /**
   * Shutdown cache manager
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.cache.clear();
    this.accessLog.clear();
    this.currentMemoryUsage = 0;
    
    console.log('[CacheManager] 🏁 Memory optimization expert shut down');
  }
}

/**
 * Create a cache manager instance
 */
export function createCacheManager(eventBus: EventBus): CacheManager {
  return new CacheManager(eventBus);
}