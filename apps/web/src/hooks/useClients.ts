import { useState, useEffect, useCallback } from 'react';
import { Client, ClientExportRequest } from '../types/client';

// Mock data for development
const mockClients: Client[] = [
  {
    id: '1',
    name: 'TechCorp Inc.',
    email: 'contact@techcorp.com',
    phone: '+1-555-0123',
    website: 'https://techcorp.com',
    primaryContact: 'Sarah Johnson',
    tags: ['Premium', 'Long-term', 'Technology'],
    addresses: [
      {
        id: 'addr-1',
        label: 'HQ',
        line1: '123 Tech Street',
        line2: 'Suite 100',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        country: 'USA',
        phone: '+1-555-0123'
      },
      {
        id: 'addr-2',
        label: 'Billing',
        line1: '456 Finance Ave',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        country: 'USA'
      }
    ],
    orders: [
      {
        id: 'order-1',
        orderNumber: 'PO-2024-001',
        skuCount: 150,
        status: 'fulfilled',
        totalCost: 12500,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-02-15T14:30:00Z',
        vendorIds: ['vendor-1', 'vendor-2']
      },
      {
        id: 'order-2',
        orderNumber: 'PO-2024-002',
        skuCount: 75,
        status: 'in_production',
        totalCost: 8500,
        createdAt: '2024-02-01T09:15:00Z',
        vendorIds: ['vendor-1']
      }
    ],
    vendorsUsed: ['TechCorp Manufacturing', 'Precision Components Ltd'],
    notes: 'Excellent client with consistent orders. Prefers premium quality components.',
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-02-15T14:30:00Z'
  },
  {
    id: '2',
    name: 'Fashion Forward',
    email: 'orders@fashionforward.com',
    phone: '+1-555-0456',
    website: 'https://fashionforward.com',
    primaryContact: 'Emily Davis',
    tags: ['Fashion', 'Retail', 'Seasonal'],
    addresses: [
      {
        id: 'addr-3',
        label: 'HQ',
        line1: '789 Fashion Blvd',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'USA',
        phone: '+1-555-0456'
      }
    ],
    orders: [
      {
        id: 'order-3',
        orderNumber: 'PO-2024-003',
        skuCount: 500,
        status: 'quoted',
        totalCost: 25000,
        createdAt: '2024-02-10T11:20:00Z',
        vendorIds: ['vendor-3']
      }
    ],
    vendorsUsed: ['Precision Textiles Ltd'],
    notes: 'Seasonal fashion retailer. Orders peak during Q3-Q4.',
    createdAt: '2024-01-15T12:00:00Z',
    updatedAt: '2024-02-10T11:20:00Z'
  },
  {
    id: '3',
    name: 'ElectroTech Solutions',
    email: 'procurement@electrotech.com',
    phone: '+81-3-1234-5678',
    website: 'https://electrotech.com',
    primaryContact: 'Kenji Tanaka',
    tags: ['Technology', 'B2B', 'International'],
    addresses: [
      {
        id: 'addr-4',
        label: 'HQ',
        line1: '1-2-3 Shibuya',
        line2: 'Shibuya-ku',
        city: 'Tokyo',
        postalCode: '150-0002',
        country: 'Japan',
        phone: '+81-3-1234-5678'
      }
    ],
    orders: [
      {
        id: 'order-4',
        orderNumber: 'PO-2024-004',
        skuCount: 200,
        status: 'draft',
        createdAt: '2024-02-20T16:45:00Z',
        vendorIds: ['vendor-4']
      }
    ],
    vendorsUsed: ['Global Components Inc'],
    notes: 'Japanese technology company. Requires high-quality electronic components.',
    createdAt: '2024-01-20T09:30:00Z',
    updatedAt: '2024-02-20T16:45:00Z'
  }
];

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
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let filteredClients = [...mockClients];
      
      // Apply search filter
      if (params?.search) {
        const searchTerm = params.search.toLowerCase();
        filteredClients = filteredClients.filter(client =>
          client.name.toLowerCase().includes(searchTerm) ||
          client.email?.toLowerCase().includes(searchTerm) ||
          client.phone?.includes(searchTerm) ||
          client.primaryContact?.toLowerCase().includes(searchTerm) ||
          client.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }
      
      // Apply sorting
      if (params?.sort) {
        const [field, direction] = params.sort.split(':');
        filteredClients.sort((a, b) => {
          let aVal = a[field as keyof Client];
          let bVal = b[field as keyof Client];
          
          if (typeof aVal === 'string' && typeof bVal === 'string') {
            return direction === 'desc' 
              ? bVal.localeCompare(aVal)
              : aVal.localeCompare(bVal);
          }
          
          if (typeof aVal === 'number' && typeof bVal === 'number') {
            return direction === 'desc' ? bVal - aVal : aVal - bVal;
          }
          
          return 0;
        });
      }
      
      setClients(filteredClients);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  }, [params?.search, params?.sort]);

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
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const foundClient = mockClients.find(c => c.id === id);
        if (foundClient) {
          setClient(foundClient);
        } else {
          setError('Client not found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch client');
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
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newClient: Client = {
        ...clientData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // In a real app, this would make an API call
      console.log('Creating client:', newClient);
      
      return newClient;
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
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedClient = {
        ...updates,
        id,
        updatedAt: new Date().toISOString()
      };
      
      // In a real app, this would make an API call
      console.log('Updating client:', updatedClient);
      
      return updatedClient;
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
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, this would make an API call
      console.log('Deleting client:', id);
      
      return true;
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
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real app, this would make an API call to export endpoint
      console.log('Exporting clients:', request);
      
      // Mock response
      const filename = `clients_export_${Date.now()}.${request.format}`;
      const mimeType = request.format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      
      return {
        filename,
        mimeType,
        data: 'mock-export-data'
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export clients');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { exportClients, loading, error };
}
