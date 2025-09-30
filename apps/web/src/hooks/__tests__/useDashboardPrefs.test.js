import { renderHook, act } from '@testing-library/react';
import { useDashboardPrefs } from '../useDashboardPrefs';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useDashboardPrefs', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
  });

  it('should initialize with empty hidden cards when no saved data', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => useDashboardPrefs('testPage'));
    
    expect(result.current.hiddenCards).toEqual([]);
    expect(result.current.isHidden('card1')).toBe(false);
  });

  it('should load saved hidden cards from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('["card1", "card2"]');
    
    const { result } = renderHook(() => useDashboardPrefs('testPage'));
    
    expect(result.current.hiddenCards).toEqual(['card1', 'card2']);
    expect(result.current.isHidden('card1')).toBe(true);
    expect(result.current.isHidden('card3')).toBe(false);
  });

  it('should toggle card visibility and persist to localStorage', () => {
    localStorageMock.getItem.mockReturnValue('[]');
    
    const { result } = renderHook(() => useDashboardPrefs('testPage'));
    
    act(() => {
      result.current.toggleCard('card1');
    });
    
    expect(result.current.hiddenCards).toEqual(['card1']);
    expect(result.current.isHidden('card1')).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'sla.testPage.hiddenCards',
      '["card1"]'
    );
  });

  it('should handle invalid localStorage data gracefully', () => {
    localStorageMock.getItem.mockReturnValue('invalid json');
    
    const { result } = renderHook(() => useDashboardPrefs('testPage'));
    
    expect(result.current.hiddenCards).toEqual([]);
  });
});
