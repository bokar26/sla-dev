import { post } from "@/lib/http";

const postForm = async (path: string, files: File[]) => {
  const fd = new FormData();
  files.forEach(f => fd.append("files", f));
  return post(path, fd);
};

export const uploadOrdersSheet = (files: File[]) => postForm("/api/uploads/orders/sheet", files);   // -> { created: Order[] }
export const uploadOrderFiles  = (files: File[]) => postForm("/api/uploads/orders/files", files);   // -> { created: Order[] }
export const createOrder       = (body: any)      => post("/api/orders", body);                 // -> { order }
