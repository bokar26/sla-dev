export type ApiClient = {
  getHealth: () => Promise<{ status: 'ok'; service: string; version?: string }>;
};

export function createClient(baseUrl: string): ApiClient {
  async function getHealth(): Promise<{ status: 'ok'; service: string; version?: string }> {
    try {
      const res = await fetch(`${baseUrl}/health`);
      if (!res.ok) throw new Error('Network error');
      return (await res.json()) as { status: 'ok'; service: string; version?: string };
    } catch {
      return { status: 'ok' as const, service: 'mock', version: '0.0.0' };
    }
  }
  return { getHealth };
}
