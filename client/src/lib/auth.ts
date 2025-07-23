import { apiRequest } from "./queryClient";

export interface User {
  id: number;
  email: string;
  role: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await apiRequest("POST", "/api/auth/login", {
      email,
      password,
    });
    return response.json();
  },

  signup: async (email: string, password: string, role: string = "jobseeker"): Promise<AuthResponse> => {
    const response = await apiRequest("POST", "/api/auth/signup", {
      email,
      password,
      role,
    });
    return response.json();
  },

  getMe: async (): Promise<{ user: User }> => {
    const response = await apiRequest("GET", "/api/auth/me");
    return response.json();
  },
};

export const setAuthToken = (token: string) => {
  localStorage.setItem("auth_token", token);
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem("auth_token");
};

export const removeAuthToken = () => {
  localStorage.removeItem("auth_token");
};
