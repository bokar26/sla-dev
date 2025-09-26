import React, { useMemo, useState, useEffect } from 'react';
import SavedCard from './SavedCard';
import SavedTable from './SavedTable';
import SavedDetails from './SavedDetails';
import ExportVendorsModal from './ExportVendorsModal';
import { mergeContactsIntoSaved } from '@/utils/mergeContacts';
import { Search, List, Grid3X3, Building2, Download, CheckSquare, Square, SlidersHorizontal } from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';

export default function SavedVendorsPanel() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [query, setQuery] = useState('');
  const [view, setView] = useState('cards'); // 'cards' | 'table'
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);
  
  // Selection and export state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [exportOpen, setExportOpen] = useState(false);

  // Load mock data
  useEffect(() => {
    const loadMockData = async () => {
      try {
        setLoading(true);
        
        // Mock factory data
        const mockFactories = [
          {
            id: 1,
            name: "TechCorp Manufacturing",
            location: "Shenzhen, China",
            region: "APAC",
            coordinates: { lat: 22.5431, lng: 114.0579 },
            specialties: ["Electronics", "Consumer Goods", "IoT Devices"],
            rating: 4.8,
            reviewCount: 127,
            avgDeliveryTime: "15-20 days",
            minOrderQuantity: "1000 units",
            certifications: ["ISO 9001", "CE", "FCC"],
            savedDate: "2024-01-15",
            lastContact: "2024-01-20",
            notes: "Excellent for electronic components, very responsive team",
            customers: [
              {
                id: "cust-1",
                name: "TechStart Inc",
                region: "North America",
                products: ["Smartphones", "Tablets", "Wearables"],
                contact: {
                  name: "Sarah Johnson",
                  email: "sarah@techstart.com",
                  phone: "+1-555-0123"
                },
                tags: ["Premium", "Long-term"],
                relationship: "active",
                notes: [
                  {
                    id: "note-1",
                    content: "Great communication, always delivers on time",
                    createdAt: "2024-01-15T10:00:00Z"
                  }
                ]
              },
              {
                id: "cust-2",
                name: "GadgetCorp",
                region: "Europe",
                products: ["IoT Devices", "Sensors"],
                contact: {
                  name: "Marco Rossi",
                  email: "marco@gadgetcorp.com",
                  phone: "+39-02-1234-5678"
                },
                tags: ["Innovation", "R&D"],
                relationship: "active"
              }
            ],
            contact: {
              name: "David Chen",
              title: "Sales Manager",
              email: "david.chen@techcorp.com",
              phone: "+86-755-1234-5678",
              whatsapp: "+86-755-1234-5678",
              website: "https://techcorp.com",
              address: "Building A, High-Tech Park, Shenzhen, China",
              status: "active",
              lastContact: "2024-01-20"
            }
          },
          {
            id: 2,
            name: "Precision Textiles Ltd",
            location: "Dhaka, Bangladesh",
            region: "APAC",
            coordinates: { lat: 23.8103, lng: 90.4125 },
            specialties: ["Textiles", "Apparel", "Fashion"],
            rating: 4.6,
            reviewCount: 89,
            avgDeliveryTime: "20-25 days",
            minOrderQuantity: "1000 units",
            certifications: ["OEKO-TEX", "GOTS", "WRAP"],
            savedDate: "2024-01-10",
            lastContact: "2024-01-18",
            notes: "Great quality textiles, competitive pricing",
            customers: [
              {
                id: "cust-3",
                name: "Fashion Forward",
                region: "North America",
                products: ["Apparel", "Fashion Accessories"],
                contact: {
                  name: "Emily Davis",
                  email: "emily@fashionforward.com",
                  phone: "+1-555-0456"
                },
                tags: ["Fashion", "Retail"],
                relationship: "active"
              }
            ],
            contact: {
              name: "Rahman Ahmed",
              title: "Export Manager",
              email: "rahman@precisiontextiles.com",
              phone: "+880-2-1234-5678",
              whatsapp: "+880-2-1234-5678",
              website: "https://precisiontextiles.com",
              address: "Industrial Area, Dhaka, Bangladesh",
              status: "active",
              lastContact: "2024-01-18"
            }
          }
        ];

        // Mock supplier data
        const mockSuppliers = [
          {
            id: 3,
            name: "Global Components Inc",
            location: "Taipei, Taiwan",
            region: "APAC",
            coordinates: { lat: 25.0330, lng: 121.5654 },
            specialties: ["Electronics", "Components", "Semiconductors"],
            rating: 4.7,
            reviewCount: 156,
            avgDeliveryTime: "10-15 days",
            minOrderQuantity: "100 units",
            certifications: ["ISO 14001", "RoHS", "REACH"],
            savedDate: "2024-01-12",
            lastContact: "2024-01-19",
            notes: "Reliable component supplier, fast shipping",
            customers: [
              {
                id: "cust-4",
                name: "ElectroTech Solutions",
                region: "Asia Pacific",
                products: ["Semiconductors", "PCBs", "Components"],
                contact: {
                  name: "Kenji Tanaka",
                  email: "kenji@electrotech.com",
                  phone: "+81-3-1234-5678"
                },
                tags: ["Technology", "B2B"],
                relationship: "active"
              },
              {
                id: "cust-5",
                name: "Innovation Labs",
                region: "Europe",
                products: ["Research Equipment", "Prototypes"],
                contact: {
                  name: "Dr. Anna Mueller",
                  email: "anna@innovationlabs.de",
                  phone: "+49-30-1234-5678"
                },
                tags: ["R&D", "Innovation"],
                relationship: "prospect"
              }
            ],
            contact: {
              name: "Lisa Wang",
              title: "Business Development",
              email: "lisa.wang@globalcomponents.com",
              phone: "+886-2-1234-5678",
              whatsapp: "+886-2-1234-5678",
              website: "https://globalcomponents.com",
              address: "Hsinchu Science Park, Taiwan",
              status: "active",
              lastContact: "2024-01-19"
            }
          },
          {
            id: 4,
            name: "MetalWorks Solutions",
            location: "Mumbai, India",
            region: "APAC",
            coordinates: { lat: 19.0760, lng: 72.8777 },
            specialties: ["Metal Fabrication", "Machining", "Assembly"],
            rating: 4.5,
            reviewCount: 73,
            avgDeliveryTime: "25-30 days",
            minOrderQuantity: "200 units",
            certifications: ["ISO 9001", "AS9100", "IATF 16949"],
            savedDate: "2024-01-08",
            lastContact: "2024-01-17",
            notes: "Good for custom metal parts, reasonable lead times",
            customers: [
              {
                id: "cust-6",
                name: "AutoParts Manufacturing",
                region: "North America",
                products: ["Automotive Parts", "Machining Services"],
                contact: {
                  name: "Mike Johnson",
                  email: "mike@autoparts.com",
                  phone: "+1-555-0789"
                },
                tags: ["Automotive", "Manufacturing"],
                relationship: "active"
              }
            ],
            contact: {
              name: "Rajesh Kumar",
              title: "Production Manager",
              email: "rajesh@metalworks.com",
              phone: "+91-22-1234-5678",
              whatsapp: "+91-22-1234-5678",
              website: "https://metalworks.com",
              address: "Industrial Estate, Mumbai, India",
              status: "active",
              lastContact: "2024-01-17"
            }
          }
        ];

        // Merge contact data and add type field
        const { savedFactories: enrichedFactories, savedSuppliers: enrichedSuppliers } = mergeContactsIntoSaved({
          savedFactories: mockFactories,
          savedSuppliers: mockSuppliers
        });

        const factoriesWithType = enrichedFactories.map(factory => ({ ...factory, type: 'factory' }));
        const suppliersWithType = enrichedSuppliers.map(supplier => ({ ...supplier, type: 'supplier' }));

        setVendors([...factoriesWithType, ...suppliersWithType]);
      } catch (e) {
        setErr(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    };

    loadMockData();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter(v => {
      // Basic vendor fields
      const basicHay = [
        v.name, v.region, v.type, v.location,
        v.contact?.name, v.contact?.email, v.contact?.phone, v.contact?.website,
        v.specialties?.join?.(',') ?? '',
        v.certifications?.join?.(',') ?? '',
      ].join(' ').toLowerCase();

      // Customer fields
      const customerHay = (v.customers ?? []).map(c =>
        [
          c.name, c.region,
          (c.products ?? []).join(','),
          c.contact?.name, c.contact?.email, c.contact?.phone,
          (c.tags ?? []).join(','),
        ].join(' ')
      ).join(' ').toLowerCase();

      // Data table fields
      const dataHay = (v.dataTables ?? []).map(t =>
        t.rows.map(r => Object.values(r.cells).map(val => {
          if (val == null) return '';
          if (Array.isArray(val)) return val.join(' ');
          if (typeof val === 'object') return JSON.stringify(val);
          return String(val);
        }).join(' ')
      ).join(' ')
      ).join(' ').toLowerCase();

      const combinedHay = `${basicHay} ${customerHay} ${dataHay}`;
      return combinedHay.includes(q);
    });
  }, [vendors, query]);

  // Selection helpers
  const isSelected = (id) => selectedIds.has(id);
  const toggleOne = (id) => setSelectedIds(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const clearSelection = () => setSelectedIds(new Set());
  const selectAllFiltered = () => setSelectedIds(new Set(filtered.map(v => v.id)));

  if (err) return <div className="p-4 text-red-600">Failed to load vendors: {err}</div>;

  const onOpen = (entity) => { setSelected(entity); setOpen(true); };

  return (
    <div className="space-y-4">
      {/* Search and View Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border bg-card text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>
        
        <div className="ml-auto flex items-center gap-2">
          <button
            className={`px-2 py-1 text-xs rounded border ${selectMode ? 'bg-neutral-900 text-white' : ''}`}
            onClick={() => { setSelectMode(v => !v); if (selectMode) clearSelection(); }}
            title="Toggle select mode"
          >
            {selectMode ? 'Done' : 'Select'}
          </button>

          {selectMode && (
            <>
              <button className="px-2 py-1 text-xs rounded border" onClick={selectAllFiltered}>
                Select All (filtered)
              </button>
              <button className="px-2 py-1 text-xs rounded border" onClick={clearSelection}>
                Clear
              </button>
              <button
                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-neutral-900 text-white disabled:opacity-50"
                onClick={() => setExportOpen(true)}
                disabled={selectedIds.size === 0}
                title="Export selected"
              >
                <Download className="size-3.5" /> Export
              </button>
            </>
          )}

          <div className="flex items-center gap-1">
            <button
              className={`px-2 py-1 text-xs rounded ${view==='cards' ? 'bg-neutral-900 text-white' : 'bg-neutral-100'}`}
              onClick={() => setView('cards')}
            >Cards</button>
            <button
              className={`px-2 py-1 text-xs rounded ${view==='table' ? 'bg-neutral-900 text-white' : 'bg-neutral-100'}`}
              onClick={() => setView('table')}
            >Table</button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div>
        <p className="text-sm text-muted-foreground">
          {loading ? 'Loading...' : `${filtered.length} vendor${filtered.length !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl border bg-neutral-50 animate-pulse" />
          ))}
        </div>
      ) : view === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((e) => (
            <SavedCard
              key={e.id}
              entity={e}
              onOpen={onOpen}
              selectable={selectMode}
              selected={isSelected(e.id)}
              onToggleSelect={() => toggleOne(e.id)}
            />
          ))}
        </div>
      ) : (
        <SavedTable
          data={filtered}
          onOpen={onOpen}
          selectable={selectMode}
          selectedIds={selectedIds}
          onToggleSelect={toggleOne}
        />
      )}

      {/* Empty State */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No vendors found</h3>
          <p className="text-muted-foreground">
            {query ? "Try adjusting your search" : "No saved vendors available"}
          </p>
        </div>
      )}

      <SavedDetails open={open} onOpenChange={setOpen} entity={selected} />
      
      {/* Export Modal */}
      {exportOpen && (
        <ExportVendorsModal
          onClose={() => setExportOpen(false)}
          vendors={filtered.filter(v => selectedIds.has(v.id))}
        />
      )}
    </div>
  );
}
