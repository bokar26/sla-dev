import { AuthProvider } from "@refinedev/core";
import { http } from "./dataProvider";

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    try {
      console.log("🔐 authProvider.login called with:", { email });
      const { data } = await http.post("/api/auth/login", {
        email,
        password,
      });
      
      console.log("🔐 authProvider.login response:", data);
      localStorage.setItem("admin_token", data.access_token);
      localStorage.setItem("admin_user", JSON.stringify(data.user));
      
      return {
        success: true,
        redirectTo: "/admin/overview",
      };
    } catch (error: any) {
      console.log("🔐 authProvider.login error:", error);
      return {
        success: false,
        error: {
          message: error.response?.data?.detail || "Login failed",
          name: "LoginError",
        },
      };
    }
  },
  
  logout: async () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    return {
      success: true,
      redirectTo: "/admin/login",
    };
  },
  
  check: async () => {
    const token = localStorage.getItem("admin_token");
    console.log("🔐 auth.check token present?", !!token);
    if (!token) {
      return { authenticated: false, redirectTo: "/admin/login" };
    }
    return { authenticated: true };
  },
  
  getIdentity: async () => {
    const userStr = localStorage.getItem("admin_user");
    if (userStr) {
      return JSON.parse(userStr);
    }
    
    try {
      const { data } = await http.get("/api/auth/me");
      localStorage.setItem("admin_user", JSON.stringify(data));
      return data;
    } catch (error) {
      return null;
    }
  },
  
  onError: async (error) => {
    console.log("🔐 auth.onError", error?.response?.status);
    if (error?.response?.status === 401) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
      return {
        logout: true,
        redirectTo: "/admin/login",
      };
    }
    return {};
  },
  
  getPermissions: async () => {
    const userStr = localStorage.getItem("admin_user");
    if (userStr) {
      const user = JSON.parse(userStr);
      return {
        role: user.role,
        isAdmin: user.is_admin,
      };
    }
    return {};
  },
};
