import { EventBus } from './EventBus';

export interface DashboardData {
  id: string;
  title: string;
  type: string;
  data: any;
  timestamp: number;
}

export interface DashboardMetrics {
  totalItems: number;
  activeItems: number;
  completedItems: number;
  performance: {
    responseTime: number;
    successRate: number;
  };
}

export class DashboardDataService {
  private eventBus: EventBus;
  private data: Map<string, DashboardData> = new Map();
  private metrics: DashboardMetrics = {
    totalItems: 0,
    activeItems: 0,
    completedItems: 0,
    performance: {
      responseTime: 0,
      successRate: 100
    }
  };

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
    this.initializeEventHandlers();
  }

  private initializeEventHandlers(): void {
    // Setup event listeners
    this.eventBus.on('dashboard:data:updated', this.handleDataUpdate.bind(this));
    this.eventBus.on('dashboard:metrics:refresh', this.refreshMetrics.bind(this));
  }

  private handleDataUpdate(data: DashboardData): void {
    this.data.set(data.id, data);
    this.refreshMetrics();
  }

  private refreshMetrics(): void {
    const items = Array.from(this.data.values());
    this.metrics = {
      totalItems: items.length,
      activeItems: items.filter(item => item.type === 'active').length,
      completedItems: items.filter(item => item.type === 'completed').length,
      performance: {
        responseTime: this.calculateAverageResponseTime(items),
        successRate: this.calculateSuccessRate(items)
      }
    };
    
    this.eventBus.emit('dashboard:metrics:updated', this.metrics);
  }

  private calculateAverageResponseTime(items: DashboardData[]): number {
    if (items.length === 0) return 0;
    const times = items.map(item => item.data?.responseTime || 0);
    return times.reduce((sum, time) => sum + time, 0) / times.length;
  }

  private calculateSuccessRate(items: DashboardData[]): number {
    if (items.length === 0) return 100;
    const successful = items.filter(item => item.data?.success !== false).length;
    return (successful / items.length) * 100;
  }

  public getData(id: string): DashboardData | undefined {
    return this.data.get(id);
  }

  public getAllData(): DashboardData[] {
    return Array.from(this.data.values());
  }

  public getMetrics(): DashboardMetrics {
    return { ...this.metrics };
  }

  public updateData(id: string, updates: Partial<DashboardData>): void {
    const existing = this.data.get(id);
    if (existing) {
      const updated = { ...existing, ...updates, timestamp: Date.now() };
      this.data.set(id, updated);
      this.eventBus.emit('dashboard:data:updated', updated);
    }
  }

  public addData(data: Omit<DashboardData, 'timestamp'>): void {
    const newData: DashboardData = {
      ...data,
      timestamp: Date.now()
    };
    this.data.set(data.id, newData);
    this.eventBus.emit('dashboard:data:added', newData);
  }

  public removeData(id: string): void {
    if (this.data.delete(id)) {
      this.eventBus.emit('dashboard:data:removed', { id });
      this.refreshMetrics();
    }
  }

  public clearData(): void {
    this.data.clear();
    this.refreshMetrics();
    this.eventBus.emit('dashboard:data:cleared');
  }
}