/**
 * ID normalization utilities for vendor/factory records
 * Handles various ID field names and ensures canonical ID extraction
 */

export function extractFactoryId(item: any): string | null {
  // Try various common ID field names in order of preference
  return (
    item?.factoryId ??
    item?.id ??
    item?._id ??
    item?.vendorId ??
    item?.canonicalId ??
    item?.slug ??
    null
  );
}

export function normalizeFactoryId(id: string | number | null | undefined): string | null {
  if (!id) return null;
  return String(id).trim() || null;
}

export function isValidFactoryId(id: string | null): boolean {
  if (!id) return false;
  // Basic validation - not empty, not just whitespace, not "undefined" or "null"
  const trimmed = id.trim();
  return trimmed.length > 0 && trimmed !== 'undefined' && trimmed !== 'null';
}

// Debug helper for development
export function debugFactoryId(item: any, context: string = 'unknown'): void {
  if (import.meta.env.DEV) {
    const extracted = extractFactoryId(item);
    console.debug(`[${context}] ID extraction:`, {
      item: item,
      extracted: extracted,
      isValid: isValidFactoryId(extracted)
    });
  }
}
