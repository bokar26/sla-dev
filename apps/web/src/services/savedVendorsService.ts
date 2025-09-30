import { get, post } from "@/lib/http";

export async function listSavedVendors() {
  return get("/api/vendors/saved"); // -> { items: SavedVendor[] }
}

export async function saveVendorApi(factoryId: string) {
  const payload = { factoryId, vendorId: factoryId, source: "search" };
  // prefer vendors/save, fallback to factories/save
  try {
    return await post("/api/vendors/save", payload);
  } catch (e: any) {
    if (!e.message.includes('404')) throw e;
    return await post("/api/factories/save", payload);
  }
}
