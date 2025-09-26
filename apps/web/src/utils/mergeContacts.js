/**
 * Utility to merge contact data into saved factories and suppliers
 * This function enriches saved entities with detailed contact information
 */

/**
 * @typedef {Object} ContactInfo
 * @property {string=} name - Contact person name
 * @property {string=} title - Contact person title/position
 * @property {string=} email - Email address
 * @property {string=} phone - Phone number
 * @property {string=} whatsapp - WhatsApp number
 * @property {string=} wechat - WeChat ID
 * @property {string=} website - Website URL
 * @property {string=} address - Physical address
 * @property {string=} notes - Contact notes
 * @property {{ linkedin?: string, x?: string, instagram?: string }=} social - Social media links
 */

/**
 * @typedef {Object} SavedEntity
 * @property {string} id
 * @property {'factory'|'supplier'} type
 * @property {string} name
 * @property {string=} region
 * @property {ContactInfo=} contact - Enhanced contact information
 * @property {any=} meta - Keep existing fields
 */

/**
 * Mock contact data that was previously in the Contacts component
 * In a real app, this would come from an API or database
 */
const mockContacts = [
  {
    id: 'CONT-001',
    entityId: 1, // Links to saved factory/supplier ID
    factoryName: 'TechCorp Manufacturing',
    contactName: 'Li Wei',
    position: 'Sales Manager',
    phone: '+86 138 0013 8000',
    whatsapp: '+86 138 0013 8000',
    email: 'li.wei@techcorp.com',
    address: 'Shenzhen, Guangdong, China',
    website: 'www.techcorp.com',
    specialties: ['Electronics', 'Consumer Goods', 'Smart Devices'],
    rating: 4.8,
    lastContact: '2024-01-15',
    status: 'active',
    notes: 'Excellent communication, fast response times',
    social: {
      linkedin: 'https://linkedin.com/in/liwei-techcorp',
      wechat: 'liwei_techcorp'
    }
  },
  {
    id: 'CONT-002',
    entityId: 2,
    factoryName: 'Precision Parts Ltd',
    contactName: 'Chen Ming',
    position: 'Production Director',
    phone: '+86 20 8765 4321',
    whatsapp: '+86 20 8765 4321',
    email: 'chen.ming@precisionparts.com',
    address: 'Guangzhou, China',
    website: 'www.precisionparts.com',
    specialties: ['Automotive', 'Industrial', 'Machining'],
    rating: 4.6,
    lastContact: '2024-01-10',
    status: 'active',
    notes: 'Specializes in precision machining',
    social: {
      linkedin: 'https://linkedin.com/in/chenming-precision'
    }
  },
  {
    id: 'CONT-003',
    entityId: 3,
    factoryName: 'Global Textiles Co',
    contactName: 'Ahmed Hassan',
    position: 'Operations Manager',
    phone: '+880 1712 345678',
    whatsapp: '+880 1712 345678',
    email: 'ahmed@globaltextiles.com',
    address: 'Dhaka, Bangladesh',
    website: 'www.globaltextiles.com',
    specialties: ['Textiles', 'Apparel', 'Fashion'],
    rating: 4.5,
    lastContact: '2024-01-05',
    status: 'active',
    notes: 'Good quality control, competitive pricing'
  },
  {
    id: 'CONT-004',
    entityId: 1, // Links to supplier ID 1
    factoryName: 'Raw Materials Plus',
    contactName: 'Rajesh Kumar',
    position: 'Business Development',
    phone: '+91 98765 43210',
    whatsapp: '+91 98765 43210',
    email: 'rajesh@rawmaterialsplus.com',
    address: 'Mumbai, India',
    website: 'www.rawmaterialsplus.com',
    specialties: ['Raw Materials', 'Chemicals', 'Plastics'],
    rating: 4.5,
    lastContact: '2024-01-12',
    status: 'active',
    notes: 'Reliable raw materials supplier, good quality control',
    social: {
      linkedin: 'https://linkedin.com/in/rajesh-kumar-rawmaterials'
    }
  },
  {
    id: 'CONT-005',
    entityId: 2, // Links to supplier ID 2
    factoryName: 'Component Solutions',
    contactName: 'Nguyen Van Minh',
    position: 'Sales Director',
    phone: '+84 28 9876 5432',
    whatsapp: '+84 28 9876 5432',
    email: 'minh@componentsolutions.com',
    address: 'Ho Chi Minh City, Vietnam',
    website: 'www.componentsolutions.com',
    specialties: ['Electronic Components', 'Semiconductors', 'PCBs'],
    rating: 4.3,
    lastContact: '2024-01-14',
    status: 'active',
    notes: 'Good for electronic components, competitive pricing',
    social: {
      linkedin: 'https://linkedin.com/in/nguyen-van-minh-components'
    }
  }
];

/**
 * Merges contact data into saved factories and suppliers
 * @param {Object} params
 * @param {Array} params.savedFactories - Array of saved factory objects
 * @param {Array} params.savedSuppliers - Array of saved supplier objects
 * @param {Array} params.contacts - Array of contact objects (optional, uses mock data if not provided)
 * @returns {Object} Object with enriched savedFactories and savedSuppliers
 */
export function mergeContactsIntoSaved({ 
  savedFactories = [], 
  savedSuppliers = [], 
  contacts = mockContacts 
}) {
  // Create lookup maps for efficient matching
  const byEntityId = new Map(contacts.filter(c => c.entityId).map(c => [c.entityId, c]));
  const byEmail = new Map(contacts.filter(c => c.email).map(c => [c.email.toLowerCase(), c]));
  const byPhone = new Map(contacts.filter(c => c.phone).map(c => [c.phone.replace(/\D/g, ''), c]));
  const byName = new Map(contacts.filter(c => c.factoryName).map(c => [c.factoryName.toLowerCase(), c]));

  /**
   * Normalizes and enriches a saved entity with contact information
   * @param {Object} item - Saved factory or supplier object
   * @returns {Object} Enriched saved entity
   */
  const normalize = (item) => {
    // If already enriched, return as is
    if (item?.contact?.name && item?.contact?.title) {
      return item;
    }

    let contact = null;

    // Prefer exact entityId match
    if (byEntityId.has(item.id)) {
      contact = byEntityId.get(item.id);
    }
    // Fallback to email match
    else if (item.contact?.email && byEmail.has(item.contact.email.toLowerCase())) {
      contact = byEmail.get(item.contact.email.toLowerCase());
    }
    // Fallback to phone match
    else if (item.contact?.phone) {
      const phoneKey = item.contact.phone.replace(/\D/g, '');
      if (byPhone.has(phoneKey)) {
        contact = byPhone.get(phoneKey);
      }
    }
    // Fallback to name match
    else if (byName.has(item.name.toLowerCase())) {
      contact = byName.get(item.name.toLowerCase());
    }

    // Map contact object into our unified shape
    const mappedContact = contact ? {
      name: contact.contactName || contact.name,
      title: contact.position || contact.title,
      email: contact.email,
      phone: contact.phone,
      whatsapp: contact.whatsapp,
      wechat: contact.wechat,
      website: contact.website,
      address: contact.address,
      notes: contact.notes,
      social: {
        linkedin: contact.social?.linkedin,
        x: contact.social?.x,
        instagram: contact.social?.instagram,
        wechat: contact.social?.wechat
      },
      // Additional contact metadata
      lastContact: contact.lastContact,
      status: contact.status,
      rating: contact.rating
    } : item.contact; // Keep existing contact if no match found

    return { 
      ...item, 
      contact: mappedContact 
    };
  };

  return {
    savedFactories: savedFactories.map(normalize),
    savedSuppliers: savedSuppliers.map(normalize),
  };
}

/**
 * Helper function to get contact status color classes
 * @param {string} status - Contact status
 * @returns {string} CSS classes for status styling
 */
export function getContactStatusColor(status) {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
    case 'inactive':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

/**
 * Helper function to get contact status icon
 * @param {string} status - Contact status
 * @returns {JSX.Element} Status icon component
 */
export function getContactStatusIcon(status) {
  // Note: This would need to import the icons from lucide-react in the component that uses it
  switch (status) {
    case 'active':
      return 'CheckCircle';
    case 'inactive':
      return 'AlertCircle';
    default:
      return 'Clock';
  }
}
