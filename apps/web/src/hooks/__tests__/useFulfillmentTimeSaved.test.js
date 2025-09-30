import { renderHook, waitFor } from '@testing-library/react';
import { useFulfillmentTimeSaved } from '../useFulfillmentTimeSaved';

// Mock fetch
global.fetch = jest.fn();

describe('useFulfillmentTimeSaved', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it('should return loading state initially', () => {
    fetch.mockResolvedValueOnce({
      ok: false,
    });

    const { result } = renderHook(() => useFulfillmentTimeSaved());
    
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBe(null);
  });

  it('should return placeholder data when fulfillment endpoint fails', async () => {
    fetch
      .mockResolvedValueOnce({ ok: false }) // fulfillment endpoint fails
      .mockResolvedValueOnce({ ok: false }); // supply center fallback also fails

    const { result } = renderHook(() => useFulfillmentTimeSaved());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual({
      time_saved_minutes: 135,
      time_baseline_minutes: 420,
      fulfillment_specific: false,
      isPlaceholder: true
    });
  });

  it('should use supply center data as fallback when fulfillment endpoint fails', async () => {
    const supplyCenterData = {
      time_saved_minutes: 120,
      time_baseline_minutes: 300
    };

    fetch
      .mockResolvedValueOnce({ ok: false }) // fulfillment endpoint fails
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(supplyCenterData)
      });

    const { result } = renderHook(() => useFulfillmentTimeSaved());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual({
      time_saved_minutes: 120,
      time_baseline_minutes: 300,
      fulfillment_specific: false
    });
  });

  it('should use fulfillment-specific data when available', async () => {
    const fulfillmentData = {
      time_saved_minutes: 90,
      time_baseline_minutes: 240,
      fulfillment_specific: true
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(fulfillmentData)
    });

    const { result } = renderHook(() => useFulfillmentTimeSaved());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(fulfillmentData);
  });
});
