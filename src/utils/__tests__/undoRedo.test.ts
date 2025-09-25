/**
 * Undo/Redo System Tests
 * Tests for action history and state management
 */

import {
  UndoRedoManager,
  ActionHistory,
  StateManager,
  createAction,
  executeAction,
  undoAction,
  redoAction
} from '../undoRedo';

// Mock actions for testing
const mockActions = {
  addTransaction: {
    type: 'ADD_TRANSACTION',
    execute: jest.fn(),
    undo: jest.fn(),
    data: { id: '1', amount: 100, description: 'Test transaction' }
  },
  updateTransaction: {
    type: 'UPDATE_TRANSACTION',
    execute: jest.fn(),
    undo: jest.fn(),
    data: { id: '1', amount: 150, description: 'Updated transaction' }
  },
  deleteTransaction: {
    type: 'DELETE_TRANSACTION',
    execute: jest.fn(),
    undo: jest.fn(),
    data: { id: '1' }
  }
};

describe('UndoRedoManager', () => {
  let manager: UndoRedoManager;

  beforeEach(() => {
    jest.clearAllMocks();
    manager = new UndoRedoManager();
  });

  describe('initialization', () => {
    it('should initialize with empty history', () => {
      expect(manager.canUndo()).toBe(false);
      expect(manager.canRedo()).toBe(false);
      expect(manager.getHistorySize()).toBe(0);
    });

    it('should initialize with custom max history size', () => {
      const customManager = new UndoRedoManager(50);
      expect(customManager.getMaxHistorySize()).toBe(50);
    });
  });

  describe('action execution', () => {
    it('should execute action and add to history', async () => {
      const action = { ...mockActions.addTransaction };
      action.execute.mockResolvedValue(true);

      await manager.execute(action);

      expect(action.execute).toHaveBeenCalled();
      expect(manager.canUndo()).toBe(true);
      expect(manager.getHistorySize()).toBe(1);
    });

    it('should not add to history if execution fails', async () => {
      const action = { ...mockActions.addTransaction };
      action.execute.mockRejectedValue(new Error('Execution failed'));

      await expect(manager.execute(action)).rejects.toThrow('Execution failed');
      expect(manager.canUndo()).toBe(false);
      expect(manager.getHistorySize()).toBe(0);
    });

    it('should clear redo history when new action is executed', async () => {
      const action1 = { ...mockActions.addTransaction };
      const action2 = { ...mockActions.updateTransaction };
      
      action1.execute.mockResolvedValue(true);
      action2.execute.mockResolvedValue(true);
      action1.undo.mockResolvedValue(true);

      // Execute two actions
      await manager.execute(action1);
      await manager.execute(action2);

      // Undo one action
      await manager.undo();
      expect(manager.canRedo()).toBe(true);

      // Execute new action - should clear redo history
      await manager.execute(action1);
      expect(manager.canRedo()).toBe(false);
    });
  });

  describe('undo operations', () => {
    it('should undo last action', async () => {
      const action = { ...mockActions.addTransaction };
      action.execute.mockResolvedValue(true);
      action.undo.mockResolvedValue(true);

      await manager.execute(action);
      await manager.undo();

      expect(action.undo).toHaveBeenCalled();
      expect(manager.canUndo()).toBe(false);
      expect(manager.canRedo()).toBe(true);
    });

    it('should not undo when history is empty', async () => {
      await expect(manager.undo()).rejects.toThrow('No actions to undo');
    });

    it('should handle undo failures gracefully', async () => {
      const action = { ...mockActions.addTransaction };
      action.execute.mockResolvedValue(true);
      action.undo.mockRejectedValue(new Error('Undo failed'));

      await manager.execute(action);
      await expect(manager.undo()).rejects.toThrow('Undo failed');
      
      // Action should remain in history
      expect(manager.canUndo()).toBe(true);
    });
  });

  describe('redo operations', () => {
    it('should redo undone action', async () => {
      const action = { ...mockActions.addTransaction };
      action.execute.mockResolvedValue(true);
      action.undo.mockResolvedValue(true);

      await manager.execute(action);
      await manager.undo();
      await manager.redo();

      expect(action.execute).toHaveBeenCalledTimes(2);
      expect(manager.canRedo()).toBe(false);
      expect(manager.canUndo()).toBe(true);
    });

    it('should not redo when redo history is empty', async () => {
      await expect(manager.redo()).rejects.toThrow('No actions to redo');
    });

    it('should handle redo failures gracefully', async () => {
      const action = { ...mockActions.addTransaction };
      action.execute.mockResolvedValueOnce(true);
      action.execute.mockRejectedValueOnce(new Error('Redo failed'));
      action.undo.mockResolvedValue(true);

      await manager.execute(action);
      await manager.undo();
      
      await expect(manager.redo()).rejects.toThrow('Redo failed');
      expect(manager.canRedo()).toBe(true);
    });
  });

  describe('history management', () => {
    it('should limit history size', async () => {
      const smallManager = new UndoRedoManager(2);
      const actions = [
        { ...mockActions.addTransaction, id: '1' },
        { ...mockActions.addTransaction, id: '2' },
        { ...mockActions.addTransaction, id: '3' }
      ];

      actions.forEach(action => {
        action.execute.mockResolvedValue(true);
      });

      // Execute 3 actions with max history of 2
      for (const action of actions) {
        await smallManager.execute(action);
      }

      expect(smallManager.getHistorySize()).toBe(2);
      expect(smallManager.canUndo()).toBe(true);
    });

    it('should clear all history', () => {
      manager.clearHistory();
      expect(manager.canUndo()).toBe(false);
      expect(manager.canRedo()).toBe(false);
      expect(manager.getHistorySize()).toBe(0);
    });

    it('should get history summary', async () => {
      const action = { ...mockActions.addTransaction };
      action.execute.mockResolvedValue(true);

      await manager.execute(action);
      
      const summary = manager.getHistorySummary();
      expect(summary.undoCount).toBe(1);
      expect(summary.redoCount).toBe(0);
      expect(summary.actions).toHaveLength(1);
    });
  });

  describe('batch operations', () => {
    it('should execute batch of actions as single undoable unit', async () => {
      const actions = [
        { ...mockActions.addTransaction },
        { ...mockActions.updateTransaction }
      ];

      actions.forEach(action => {
        action.execute.mockResolvedValue(true);
        action.undo.mockResolvedValue(true);
      });

      await manager.executeBatch(actions, 'Batch operation');

      expect(manager.getHistorySize()).toBe(1);
      
      // Undo should undo all actions in batch
      await manager.undo();
      
      expect(actions[0].undo).toHaveBeenCalled();
      expect(actions[1].undo).toHaveBeenCalled();
    });

    it('should rollback batch if any action fails', async () => {
      const actions = [
        { ...mockActions.addTransaction },
        { ...mockActions.updateTransaction }
      ];

      actions[0].execute.mockResolvedValue(true);
      actions[0].undo.mockResolvedValue(true);
      actions[1].execute.mockRejectedValue(new Error('Second action failed'));

      await expect(manager.executeBatch(actions, 'Batch operation'))
        .rejects.toThrow('Second action failed');

      // First action should be rolled back
      expect(actions[0].undo).toHaveBeenCalled();
      expect(manager.getHistorySize()).toBe(0);
    });
  });
});

describe('ActionHistory', () => {
  let history: ActionHistory;

  beforeEach(() => {
    history = new ActionHistory(10);
  });

  describe('basic operations', () => {
    it('should add actions to history', () => {
      const action = mockActions.addTransaction;
      history.push(action);

      expect(history.size()).toBe(1);
      expect(history.canUndo()).toBe(true);
      expect(history.canRedo()).toBe(false);
    });

    it('should pop actions from history', () => {
      const action = mockActions.addTransaction;
      history.push(action);
      
      const poppedAction = history.pop();
      
      expect(poppedAction).toBe(action);
      expect(history.size()).toBe(0);
    });

    it('should peek at last action without removing', () => {
      const action = mockActions.addTransaction;
      history.push(action);
      
      const peekedAction = history.peek();
      
      expect(peekedAction).toBe(action);
      expect(history.size()).toBe(1);
    });
  });

  describe('undo/redo state', () => {
    it('should track undo/redo positions correctly', () => {
      const action1 = mockActions.addTransaction;
      const action2 = mockActions.updateTransaction;
      
      history.push(action1);
      history.push(action2);
      
      expect(history.canUndo()).toBe(true);
      expect(history.canRedo()).toBe(false);
      
      // Move to undo position
      history.moveToUndo();
      expect(history.canRedo()).toBe(true);
      
      history.moveToUndo();
      expect(history.canUndo()).toBe(false);
    });

    it('should clear redo history when new action is added', () => {
      const action1 = mockActions.addTransaction;
      const action2 = mockActions.updateTransaction;
      const action3 = mockActions.deleteTransaction;
      
      history.push(action1);
      history.push(action2);
      history.moveToUndo(); // Create redo history
      
      expect(history.canRedo()).toBe(true);
      
      history.push(action3); // Should clear redo history
      expect(history.canRedo()).toBe(false);
    });
  });
});

describe('StateManager', () => {
  let stateManager: StateManager;

  beforeEach(() => {
    stateManager = new StateManager();
  });

  describe('state snapshots', () => {
    it('should create state snapshots', () => {
      const state = { balance: 1000, transactions: [] };
      const snapshot = stateManager.createSnapshot(state);

      expect(snapshot).toBeDefined();
      expect(snapshot.timestamp).toBeDefined();
      expect(snapshot.state).toEqual(state);
    });

    it('should restore state from snapshot', () => {
      const originalState = { balance: 1000, transactions: [] };
      const snapshot = stateManager.createSnapshot(originalState);
      
      const restoredState = stateManager.restoreSnapshot(snapshot);
      
      expect(restoredState).toEqual(originalState);
    });

    it('should handle deep object cloning', () => {
      const state = { 
        balance: 1000, 
        transactions: [{ id: 1, amount: 100 }],
        nested: { deep: { value: 'test' } }
      };
      
      const snapshot = stateManager.createSnapshot(state);
      const restoredState = stateManager.restoreSnapshot(snapshot);
      
      // Should be deep copy, not reference
      expect(restoredState).toEqual(state);
      expect(restoredState).not.toBe(state);
      expect(restoredState.transactions).not.toBe(state.transactions);
    });
  });

  describe('state comparison', () => {
    it('should detect state differences', () => {
      const state1 = { balance: 1000, transactions: [] };
      const state2 = { balance: 900, transactions: [] };
      
      const differences = stateManager.compareStates(state1, state2);
      
      expect(differences).toBeDefined();
      expect(differences.balance).toBeDefined();
    });

    it('should handle identical states', () => {
      const state = { balance: 1000, transactions: [] };
      
      const differences = stateManager.compareStates(state, state);
      
      expect(Object.keys(differences)).toHaveLength(0);
    });
  });
});
