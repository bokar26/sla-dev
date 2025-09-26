import type { Vendor, CustomerServed } from '@/types/vendor';

function coerceCustomers(raw: any): CustomerServed[] | undefined {
  if (!raw) return undefined;
  if (Array.isArray(raw)) return raw;
  return undefined;
}

function deriveCustomersFromMeta(item: any): CustomerServed[] | undefined {
  // Common fallbacks: clients, buyers, brands
  if (Array.isArray(item?.clients)) {
    return item.clients.map((name: string) => ({ 
      id: crypto.randomUUID(), 
      name,
      relationship: 'active' as const
    }));
  }
  if (Array.isArray(item?.buyers)) {
    return item.buyers.map((name: string) => ({ 
      id: crypto.randomUUID(), 
      name,
      relationship: 'active' as const
    }));
  }
  if (Array.isArray(item?.brands)) {
    return item.brands.map((name: string) => ({ 
      id: crypto.randomUUID(), 
      name,
      relationship: 'active' as const
    }));
  }
  return undefined;
}

export function toVendor(item: any, type: 'factory' | 'supplier'): Vendor {
  const fromItem = coerceCustomers(item?.customers);
  const fromMeta = deriveCustomersFromMeta(item);

  return {
    id: item.id ?? item._id ?? crypto.randomUUID(),
    type,
    name: item.name ?? item.companyName ?? 'Unnamed',
    region: item.region ?? item.country ?? item.location,
    matchScore: item.matchScore,
    contact: item.contact,
    customers: fromItem ?? fromMeta ?? [], // Always present (at least [])
    meta: item,
    // Additional fields
    location: item.location,
    specialties: item.specialties,
    certifications: item.certifications,
    rating: item.rating,
    reviewCount: item.reviewCount,
    avgDeliveryTime: item.avgDeliveryTime,
    minOrderQuantity: item.minOrderQuantity,
    savedDate: item.savedDate,
    lastContact: item.lastContact,
    notes: item.notes,
    coordinates: item.coordinates,
  };
}
