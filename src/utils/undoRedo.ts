/**
 * Advanced Undo/Redo System for Critical Financial Operations
 * Provides comprehensive action tracking and reversal capabilities
 */

import OfflineStorage from './indexedDB';

export interface UndoAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE' | 'BULK_UPDATE' | 'BULK_DELETE';
  entity: 'transaction' | 'recurring-bill' | 'goal' | 'category';
  timestamp: number;
  description: string;
  data: {
    before?: any;
    after?: any;
    ids?: string[];
  };
  metadata?: {
    userId?: string;
    source?: 'manual' | 'import' | 'automation';
    batchId?: string;
  };
}

export interface UndoRedoState {
  undoStack: UndoAction[];
  redoStack: UndoAction[];
  maxStackSize: number;
  isUndoing: boolean;
  isRedoing: boolean;
}

/**
 * Comprehensive Undo/Redo Manager
 */
export class UndoRedoManager {
  private state: UndoRedoState;
  private listeners: Set<(state: UndoRedoState) => void> = new Set();
  private apiCallbacks: Map<string, {
    undo: (data: any) => Promise<void>;
    redo: (data: any) => Promise<void>;
  }> = new Map();

  constructor(maxStackSize: number = 50) {
    this.state = {
      undoStack: [],
      redoStack: [],
      maxStackSize,
      isUndoing: false,
      isRedoing: false,
    };

    this.initializeCallbacks();
    this.loadFromStorage();
  }

  /**
   * Initialize API callbacks for different entity types
   */
  private initializeCallbacks(): void {
    // Transaction callbacks
    this.apiCallbacks.set('transaction', {
      undo: async (data) => {
        const response = await fetch('/api/transactions/undo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to undo transaction');
      },
      redo: async (data) => {
        const response = await fetch('/api/transactions/redo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to redo transaction');
      },
    });

    // Recurring bill callbacks
    this.apiCallbacks.set('recurring-bill', {
      undo: async (data) => {
        const response = await fetch('/api/recurring/undo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to undo recurring bill');
      },
      redo: async (data) => {
        const response = await fetch('/api/recurring/redo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to redo recurring bill');
      },
    });
  }

  /**
   * Add a new action to the undo stack
   */
  addAction(action: Omit<UndoAction, 'id' | 'timestamp'>): string {
    const actionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newAction: UndoAction = {
      ...action,
      id: actionId,
      timestamp: Date.now(),
    };

    this.state.undoStack = [newAction, ...this.state.undoStack.slice(0, this.state.maxStackSize - 1)];
    this.state.redoStack = []; // Clear redo stack when new action is added
    
    this.persistState();
    this.notifyListeners();
    
    return actionId;
  }

  /**
   * Undo the last action
   */
  async undo(): Promise<boolean> {
    if (this.state.undoStack.length === 0 || this.state.isUndoing) {
      return false;
    }

    this.state.isUndoing = true;
    this.notifyListeners();

    try {
      const [action, ...restUndo] = this.state.undoStack;
      
      // Execute the undo operation
      await this.executeUndo(action);
      
      // Update stacks
      this.state.undoStack = restUndo;
      this.state.redoStack = [action, ...this.state.redoStack];
      
      this.persistState();
      this.notifyListeners();
      
      return true;
    } catch (error) {
      console.error('Undo failed:', error);
      throw error;
    } finally {
      this.state.isUndoing = false;
      this.notifyListeners();
    }
  }

  /**
   * Redo the last undone action
   */
  async redo(): Promise<boolean> {
    if (this.state.redoStack.length === 0 || this.state.isRedoing) {
      return false;
    }

    this.state.isRedoing = true;
    this.notifyListeners();

    try {
      const [action, ...restRedo] = this.state.redoStack;
      
      // Execute the redo operation
      await this.executeRedo(action);
      
      // Update stacks
      this.state.redoStack = restRedo;
      this.state.undoStack = [action, ...this.state.undoStack];
      
      this.persistState();
      this.notifyListeners();
      
      return true;
    } catch (error) {
      console.error('Redo failed:', error);
      throw error;
    } finally {
      this.state.isRedoing = false;
      this.notifyListeners();
    }
  }

  /**
   * Execute undo operation
   */
  private async executeUndo(action: UndoAction): Promise<void> {
    const callbacks = this.apiCallbacks.get(action.entity);
    if (!callbacks) {
      throw new Error(`No undo callback found for entity: ${action.entity}`);
    }

    const undoData = {
      type: action.type,
      entity: action.entity,
      data: this.getUndoData(action),
      metadata: action.metadata,
    };

    await callbacks.undo(undoData);
    
    // Store in offline storage for persistence
    await OfflineStorage.saveAppState(`undo_${action.id}`, undoData);
  }

  /**
   * Execute redo operation
   */
  private async executeRedo(action: UndoAction): Promise<void> {
    const callbacks = this.apiCallbacks.get(action.entity);
    if (!callbacks) {
      throw new Error(`No redo callback found for entity: ${action.entity}`);
    }

    const redoData = {
      type: action.type,
      entity: action.entity,
      data: this.getRedoData(action),
      metadata: action.metadata,
    };

    await callbacks.redo(redoData);
    
    // Store in offline storage for persistence
    await OfflineStorage.saveAppState(`redo_${action.id}`, redoData);
  }

  /**
   * Get data for undo operation
   */
  private getUndoData(action: UndoAction): any {
    switch (action.type) {
      case 'CREATE':
        return { id: action.data.after?.id };
      case 'UPDATE':
        return action.data.before;
      case 'DELETE':
        return action.data.before;
      case 'BULK_UPDATE':
        return { items: action.data.before };
      case 'BULK_DELETE':
        return { items: action.data.before };
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Get data for redo operation
   */
  private getRedoData(action: UndoAction): any {
    switch (action.type) {
      case 'CREATE':
        return action.data.after;
      case 'UPDATE':
        return action.data.after;
      case 'DELETE':
        return { id: action.data.before?.id };
      case 'BULK_UPDATE':
        return { items: action.data.after };
      case 'BULK_DELETE':
        return { ids: action.data.ids };
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Clear all undo/redo history
   */
  clearHistory(): void {
    this.state.undoStack = [];
    this.state.redoStack = [];
    this.persistState();
    this.notifyListeners();
  }

  /**
   * Get current state
   */
  getState(): UndoRedoState {
    return { ...this.state };
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.state.undoStack.length > 0 && !this.state.isUndoing;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.state.redoStack.length > 0 && !this.state.isRedoing;
  }

  /**
   * Get last undoable action description
   */
  getLastUndoDescription(): string | null {
    return this.state.undoStack[0]?.description || null;
  }

  /**
   * Get last redoable action description
   */
  getLastRedoDescription(): string | null {
    return this.state.redoStack[0]?.description || null;
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: UndoRedoState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  /**
   * Persist state to storage
   */
  private async persistState(): Promise<void> {
    try {
      await OfflineStorage.saveAppState('undo_redo_state', {
        undoStack: this.state.undoStack,
        redoStack: this.state.redoStack,
      });
    } catch (error) {
      console.error('Failed to persist undo/redo state:', error);
    }
  }

  /**
   * Load state from storage
   */
  private async loadFromStorage(): Promise<void> {
    try {
      const savedState = await OfflineStorage.getAppState('undo_redo_state');
      if (savedState) {
        this.state.undoStack = savedState.undoStack || [];
        this.state.redoStack = savedState.redoStack || [];
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Failed to load undo/redo state:', error);
    }
  }

  /**
   * Create batch operations for multiple related actions
   */
  createBatch(): UndoBatch {
    return new UndoBatch(this);
  }
}

/**
 * Batch operations for grouping related actions
 */
export class UndoBatch {
  private actions: Omit<UndoAction, 'id' | 'timestamp'>[] = [];
  private manager: UndoRedoManager;
  private batchId: string;

  constructor(manager: UndoRedoManager) {
    this.manager = manager;
    this.batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add action to batch
   */
  addAction(action: Omit<UndoAction, 'id' | 'timestamp'>): void {
    this.actions.push({
      ...action,
      metadata: {
        ...action.metadata,
        batchId: this.batchId,
      },
    });
  }

  /**
   * Execute all actions in batch
   */
  commit(): string[] {
    if (this.actions.length === 0) {
      return [];
    }

    const actionIds = this.actions.map(action => this.manager.addAction(action));
    return actionIds;
  }

  /**
   * Cancel batch without committing
   */
  cancel(): void {
    this.actions = [];
  }

  /**
   * Get batch size
   */
  size(): number {
    return this.actions.length;
  }
}

// Singleton instance
const undoRedoManager = new UndoRedoManager();

/**
 * Helper functions for common operations
 */
export const UndoRedoHelpers = {
  /**
   * Create transaction action
   */
  createTransactionAction(
    type: UndoAction['type'],
    before: any,
    after: any,
    description?: string
  ): Omit<UndoAction, 'id' | 'timestamp'> {
    return {
      type,
      entity: 'transaction',
      description: description || `${type.toLowerCase()} transaction`,
      data: { before, after },
      metadata: { source: 'manual' },
    };
  },

  /**
   * Create recurring bill action
   */
  createRecurringBillAction(
    type: UndoAction['type'],
    before: any,
    after: any,
    description?: string
  ): Omit<UndoAction, 'id' | 'timestamp'> {
    return {
      type,
      entity: 'recurring-bill',
      description: description || `${type.toLowerCase()} recurring bill`,
      data: { before, after },
      metadata: { source: 'manual' },
    };
  },

  /**
   * Format action description for UI
   */
  formatActionDescription(action: UndoAction): string {
    const entityName = action.entity.replace('-', ' ');
    const actionType = action.type.toLowerCase().replace('_', ' ');
    
    return `${actionType} ${entityName}`;
  },

  /**
   * Get action icon based on type and entity
   */
  getActionIcon(action: UndoAction): string {
    const iconMap: Record<string, string> = {
      'CREATE_transaction': '💰',
      'UPDATE_transaction': '✏️',
      'DELETE_transaction': '🗑️',
      'CREATE_recurring-bill': '🔄',
      'UPDATE_recurring-bill': '✏️',
      'DELETE_recurring-bill': '🗑️',
    };

    return iconMap[`${action.type}_${action.entity}`] || '📝';
  },
};

export default undoRedoManager;