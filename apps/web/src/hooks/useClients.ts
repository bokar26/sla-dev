import { useState, useEffect, useCallback } from 'react';
import { Client, ClientExportRequest } from '../types/client';
import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api';

// Real API-based client management
const API_BASE = '/api/clients';

export function useClients(params?: {
  search?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
}) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await get('/api/clients/saved');
      setClients(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch clients');
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return {
    clients,
    loading,
    error,
    refetch: fetchClients
  };
}

export function useClient(id: string) {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const data = await get(`/api/clients/${id}`);
        setClient(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch client');
        setClient(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchClient();
    }
  }, [id]);

  return { client, loading, error };
}

export function useCreateClient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createClient = useCallback(async (clientData: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      setError(null);
      
      return await post('/api/clients', clientData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create client');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createClient, loading, error };
}

export function useUpdateClient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateClient = useCallback(async (id: string, updates: Partial<Client>) => {
    try {
      setLoading(true);
      setError(null);
      
      return await patch(`/api/clients/${id}`, updates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update client');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateClient, loading, error };
}

export function useDeleteClient() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteClient = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await del(`/api/clients/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete client');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { deleteClient, loading, error };
}

export function useExportClients() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportClients = useCallback(async (request: ClientExportRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiPost('/clients/export', request);
      
      // Response is already handled by apiPost
      
      // Handle blob response for file download
      const blob = new Blob([JSON.stringify(response)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clients-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export clients');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { exportClients, loading, error };
}