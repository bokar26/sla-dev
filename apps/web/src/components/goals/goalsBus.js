// broadcast "goals:changed" after any create/update/delete
export function emitGoalsChanged() {
  window.dispatchEvent(new CustomEvent("goals:changed"));
}

export function onGoalsChanged(fn) {
  window.addEventListener("goals:changed", fn);
  return () => window.removeEventListener("goals:changed", fn);
}

// Optional convenience hook for any page that needs to react
import { useEffect } from "react";
export function useGoalChange(callback) {
  useEffect(() => onGoalsChanged(callback), [callback]);
}
