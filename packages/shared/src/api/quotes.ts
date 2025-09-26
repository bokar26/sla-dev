import type { Quote } from '../types';

export async function getQuotesMock(): Promise<Quote[]> {
  // Replace with real API later
  return [
    { id: 'q1', sku: 'HOODIE-400GSM-BLK', price: 8.5, currency: 'USD' },
    { id: 'q2', sku: 'TEE-240GSM-WHT', price: 2.1, currency: 'USD' },
    { id: 'q3', sku: 'SOCK-GRIP-PRO', price: 1.35, currency: 'USD' }
  ];
}
