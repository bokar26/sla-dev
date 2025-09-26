import axios from "axios";
import { DataProvider } from "@refinedev/core";

const API_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

// Create axios instance with auth interceptor
const http = axios.create({
  baseURL: API_URL,
});

// Add auth token to requests
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
      // Don't redirect automatically - let Refine handle it
      console.log("🔐 401 error - token cleared");
    }
    return Promise.reject(error);
  }
);

export const dataProvider: DataProvider = {
  getList: async ({ resource, pagination, sorters, filters }) => {
    const page = pagination?.current ?? 1;
    const size = pagination?.pageSize ?? 50;
    const sort = sorters?.[0] 
      ? `${sorters[0].order === "desc" ? "-" : ""}${sorters[0].field}` 
      : undefined;
    
    // Build query params
    const params: any = { page, size };
    if (sort) params.sort = sort;
    
            // Add filters
            if (filters) {
              filters.forEach((filter) => {
                if ('field' in filter && filter.field === "q") {
                  params.q = filter.value;
                } else if ('field' in filter && filter.value !== undefined && filter.value !== null) {
                  params[filter.field] = filter.value;
                }
              });
            }
    
    const { data } = await http.get(`/api/admin/${resource}`, { params });
    
    return {
      data: data.data,
      total: data.total,
    };
  },
  
  getOne: async ({ resource, id }) => {
    const { data } = await http.get(`/api/admin/${resource}/${id}`);
    return { data };
  },
  
  create: async ({ resource, variables }) => {
    const { data } = await http.post(`/api/admin/${resource}`, variables);
    return { data };
  },
  
  update: async ({ resource, id, variables }) => {
    const { data } = await http.put(`/api/admin/${resource}/${id}`, variables);
    return { data };
  },
  
  deleteOne: async ({ resource, id }) => {
    const { data } = await http.delete(`/api/admin/${resource}/${id}`);
    return { data };
  },
  
  getApiUrl: () => API_URL,
  
  custom: async ({ url, method, payload, query, headers }) => {
    const { data } = await http.request({
      url,
      method,
      data: payload,
      params: query,
      headers,
    });
    return { data };
  },
};

export { http };
