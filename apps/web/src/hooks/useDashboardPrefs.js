import { useState, useEffect } from 'react';

/**
 * Hook for managing dashboard card visibility preferences
 * @param {string} pageKey - The page key for localStorage (e.g., 'supplyCenter')
 * @returns {object} - { hiddenCards, isHidden, toggleCard, setHiddenCards }
 */
export function useDashboardPrefs(pageKey) {
  const storageKey = `sla.${pageKey}.hiddenCards`;
  
  const [hiddenCards, setHiddenCardsState] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const isHidden = (cardId) => hiddenCards.includes(cardId);
  
  const toggleCard = (cardId) => {
    setHiddenCardsState(prev => {
      const newHidden = prev.includes(cardId) 
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId];
      return newHidden;
    });
  };

  const setHiddenCards = (cards) => {
    setHiddenCardsState(cards);
  };

  // Persist to localStorage whenever hiddenCards changes
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(hiddenCards));
  }, [hiddenCards, storageKey]);

  return {
    hiddenCards,
    isHidden,
    toggleCard,
    setHiddenCards
  };
}
