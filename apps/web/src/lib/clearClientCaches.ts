// src/lib/clearClientCaches.ts
export async function clearClientCaches() {
  try {
    // localStorage
    localStorage.clear();
    
    // sessionStorage
    sessionStorage.clear();
    
    // IndexedDB (best effort)
    if ("indexedDB" in window && (indexedDB as any).databases) {
      try {
        const dbs: any[] = await (indexedDB as any).databases();
        for (const db of dbs) {
          if (db?.name) {
            indexedDB.deleteDatabase(db.name);
          }
        }
      } catch (e) {
        console.warn("Failed to clear IndexedDB:", e);
      }
    }
    
    // Cache API
    if ("caches" in window) {
      try {
        const names = await caches.keys();
        await Promise.all(names.map(n => caches.delete(n)));
      } catch (e) {
        console.warn("Failed to clear Cache API:", e);
      }
    }
    
    console.log("Client caches cleared successfully");
  } catch (e) {
    console.warn("Error clearing client caches:", e);
  }
}
