'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';

// Types
interface AppState {
  theme: 'light' | 'dark' | 'auto';
  isOffline: boolean;
  notifications: Notification[];
  undoStack: UndoAction[];
  redoStack: UndoAction[];
  preferences: UserPreferences;
  performanceMetrics: PerformanceMetrics;
}

interface Notification {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  priority: 'critical' | 'high' | 'medium' | 'low';
  persistent?: boolean;
}

interface UndoAction {
  type: string;
  data: any;
  timestamp: Date;
  description: string;
}

interface UserPreferences {
  currency: string;
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  compactMode: boolean;
  animations: boolean;
  soundEffects: boolean;
  notifications: boolean;
}

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  apiLatency: number;
  errorRate: number;
}

type AppAction = 
  | { type: 'SET_THEME'; payload: 'light' | 'dark' | 'auto' }
  | { type: 'SET_OFFLINE'; payload: boolean }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id' | 'timestamp'> }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'ADD_UNDO_ACTION'; payload: Omit<UndoAction, 'timestamp'> }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'CLEAR_UNDO_HISTORY' }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<UserPreferences> }
  | { type: 'UPDATE_PERFORMANCE'; payload: Partial<PerformanceMetrics> };

const initialState: AppState = {
  theme: 'auto',
  isOffline: false,
  notifications: [],
  undoStack: [],
  redoStack: [],
  preferences: {
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    compactMode: false,
    animations: true,
    soundEffects: false,
    notifications: true,
  },
  performanceMetrics: {
    loadTime: 0,
    renderTime: 0,
    apiLatency: 0,
    errorRate: 0,
  },
};

/**
 * App reducer for managing global application state
 */
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    
    case 'SET_OFFLINE':
      return { ...state, isOffline: action.payload };
    
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [
          {
            ...action.payload,
            id: Date.now().toString(),
            timestamp: new Date(),
          },
          ...state.notifications,
        ].slice(0, 10), // Keep only last 10 notifications
      };
    
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };
    
    case 'CLEAR_NOTIFICATIONS':
      return { ...state, notifications: [] };
    
    case 'ADD_UNDO_ACTION':
      return {
        ...state,
        undoStack: [
          { ...action.payload, timestamp: new Date() },
          ...state.undoStack,
        ].slice(0, 50), // Keep only last 50 actions
        redoStack: [], // Clear redo stack when new action is added
      };
    
    case 'UNDO':
      if (state.undoStack.length === 0) return state;
      const [lastAction, ...restUndo] = state.undoStack;
      return {
        ...state,
        undoStack: restUndo,
        redoStack: [lastAction, ...state.redoStack],
      };
    
    case 'REDO':
      if (state.redoStack.length === 0) return state;
      const [nextAction, ...restRedo] = state.redoStack;
      return {
        ...state,
        redoStack: restRedo,
        undoStack: [nextAction, ...state.undoStack],
      };
    
    case 'CLEAR_UNDO_HISTORY':
      return { ...state, undoStack: [], redoStack: [] };
    
    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload },
      };
    
    case 'UPDATE_PERFORMANCE':
      return {
        ...state,
        performanceMetrics: { ...state.performanceMetrics, ...action.payload },
      };
    
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Convenience methods
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  addUndoAction: (action: Omit<UndoAction, 'timestamp'>) => void;
  undo: () => void;
  redo: () => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

/**
 * App provider component that wraps the application with global context
 */
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const savedPreferences = localStorage.getItem('astral-money-preferences');
      if (savedPreferences) {
        const preferences = JSON.parse(savedPreferences);
        dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences });
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('astral-money-preferences', JSON.stringify(state.preferences));
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }, [state.preferences]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => dispatch({ type: 'SET_OFFLINE', payload: false });
    const handleOffline = () => dispatch({ type: 'SET_OFFLINE', payload: true });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial state
    dispatch({ type: 'SET_OFFLINE', payload: !navigator.onLine });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Convenience methods
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp'>) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
  }, []);

  const removeNotification = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  }, []);

  const addUndoAction = useCallback((action: Omit<UndoAction, 'timestamp'>) => {
    dispatch({ type: 'ADD_UNDO_ACTION', payload: action });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' });
  }, []);

  const updatePreferences = useCallback((preferences: Partial<UserPreferences>) => {
    dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences });
  }, []);

  const contextValue: AppContextType = {
    state,
    dispatch,
    addNotification,
    removeNotification,
    addUndoAction,
    undo,
    redo,
    updatePreferences,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

/**
 * Custom hook to use the app context
 */
export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

export type { AppState, Notification, UndoAction, UserPreferences };