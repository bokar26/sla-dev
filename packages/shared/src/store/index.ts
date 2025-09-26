type Listener<T> = (state: T) => void;

export type AppState = {
  user?: { id: string; name: string } | null;
  lastSync?: number;
};

let state: AppState = { user: null, lastSync: undefined };
const listeners = new Set<Listener<AppState>>();

export const getState = () => state;

export function setState(partial: Partial<AppState>) {
  state = { ...state, ...partial };
  listeners.forEach((l) => l(state));
}

export function subscribe(listener: Listener<AppState>): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
