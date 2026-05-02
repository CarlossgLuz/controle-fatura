import { createContext, useContext, useState, type ReactNode } from 'react';

export type LaunchType = 'receita' | 'gasto';

interface LaunchSheetState {
  isOpen: boolean;
  defaultType: LaunchType;
  revision: number;
}

interface LaunchSheetContextValue extends LaunchSheetState {
  openSheet: (type?: LaunchType) => void;
  closeSheet: () => void;
  markChanged: () => void;
}

const LaunchSheetContext = createContext<LaunchSheetContextValue | null>(null);

export function LaunchSheetProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LaunchSheetState>({
    isOpen: false,
    defaultType: 'gasto',
    revision: 0,
  });

  const openSheet = (type: LaunchType = 'gasto') => {
    setState((prev) => ({ ...prev, isOpen: true, defaultType: type }));
  };

  const closeSheet = () => {
    setState((prev) => ({ ...prev, isOpen: false }));
  };

  const markChanged = () => {
    setState((prev) => ({ ...prev, revision: prev.revision + 1 }));
  };

  return (
    <LaunchSheetContext.Provider value={{ ...state, openSheet, closeSheet, markChanged }}>
      {children}
    </LaunchSheetContext.Provider>
  );
}

export function useLaunchSheet(): LaunchSheetContextValue {
  const context = useContext(LaunchSheetContext);
  if (!context) {
    throw new Error('useLaunchSheet must be used inside LaunchSheetProvider');
  }

  return context;
}
