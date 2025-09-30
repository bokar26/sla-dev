import { post } from "@/lib/http";

const postForm = async (path: string, files: File[]) => {
  const fd = new FormData();
  files.forEach(f => fd.append("files", f));
  return post(path, fd);
};

export const uploadTransactionsSheet = (files: File[]) => postForm("/api/uploads/transactions/sheet", files); // -> { created: Tx[] }
export const uploadTransactionFiles  = (files: File[]) => postForm("/api/uploads/transactions/files", files); // -> { created: Tx[] }
export const createTransaction       = (body: any)      => post("/api/transactions", body);               // -> { transaction }
