// Backward/forward compatible store for apiStatus.
// Works with both patterns:
// 1) React usage:   const online = useApiStatus(s => s.online)
// 2) Imperative:    apiStatusStore.getState().online
// 3) Legacy calls:  useApiStatus.getState().online  (shimmed here)

import React from 'react';

type ApiStatusState = {
  online: boolean;
  base: string | null;
  lastChecked?: number;
};

type ApiStatusActions = {
  setOnline: (online: boolean) => void;
  setBase: (base: string | null) => void;
  markChecked: () => void;
};

export type ApiStatus = ApiStatusState & ApiStatusActions;

// Simple store implementation
class ApiStatusStore {
  private state: ApiStatusState = {
    online: true,
    base: null,
    lastChecked: undefined,
  };

  private listeners = new Set<() => void>();

  getState(): ApiStatus {
    return {
      ...this.state,
      setOnline: (online: boolean) => {
        this.state = { ...this.state, online, lastChecked: Date.now() };
        this.notify();
      },
      setBase: (base: string | null) => {
        this.state = { ...this.state, base };
        this.notify();
      },
      markChecked: () => {
        this.state = { ...this.state, lastChecked: Date.now() };
        this.notify();
      },
    };
  }

  setState(updater: (state: ApiStatusState) => Partial<ApiStatusState>) {
    const updates = updater(this.state);
    this.state = { ...this.state, ...updates };
    this.notify();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }
}

// Create store instance
export const apiStatusStore = new ApiStatusStore();

// React hook
function _useApiStatus<T>(selector: (s: ApiStatus) => T): T {
  const [state, setState] = React.useState(() => selector(apiStatusStore.getState()));

  React.useEffect(() => {
    const unsubscribe = apiStatusStore.subscribe(() => {
      setState(selector(apiStatusStore.getState()));
    });
    return unsubscribe;
  }, [selector]);

  return state;
}

// ⚠️ Compatibility shim: attach vanilla methods to the hook
// so legacy code like useApiStatus.getState() keeps working.
(_useApiStatus as any).getState = apiStatusStore.getState.bind(apiStatusStore);
(_useApiStatus as any).setState = apiStatusStore.setState.bind(apiStatusStore);
(_useApiStatus as any).subscribe = apiStatusStore.subscribe.bind(apiStatusStore);

// Named export for components:
export const useApiStatus = _useApiStatus;
