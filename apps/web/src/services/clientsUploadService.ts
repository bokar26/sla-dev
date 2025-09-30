import { post } from "@/lib/http";

async function postForm(path: string, files: File[]) {
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));
  return post(path, fd);
}

export const uploadClientsSheet = (files: File[]) => postForm("/api/uploads/clients/sheet", files);  // -> { created, deduped }
export const uploadClientFiles  = (files: File[]) => postForm("/api/uploads/clients/files", files);  // -> { created }
export const createClient       = (body: any)      => post("/api/clients", body);                // -> { client }
