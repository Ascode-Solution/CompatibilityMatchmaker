import { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi, setAuthToken, getAuthToken, removeAuthToken, type User } from "@/lib/auth";

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  // Check if user is authenticated on app load
  const { data: userData, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: authApi.getMe,
    enabled: !!getAuthToken(),
    retry: false,
  });

  useEffect(() => {
    if (userData?.user) {
      setUser(userData.user);
    }
  }, [userData]);

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: (data) => {
      setAuthToken(data.token);
      setUser(data.user);
      queryClient.invalidateQueries();
    },
  });

  const signupMutation = useMutation({
    mutationFn: ({ email, password, role }: { email: string; password: string; role?: string }) =>
      authApi.signup(email, password, role),
    onSuccess: (data) => {
      setAuthToken(data.token);
      setUser(data.user);
      queryClient.invalidateQueries();
    },
  });

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const signup = async (email: string, password: string, role: string = "jobseeker") => {
    await signupMutation.mutateAsync({ email, password, role });
  };

  const logout = () => {
    removeAuthToken();
    setUser(null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        signup,
        logout,
        isLoading: isLoading || loginMutation.isPending || signupMutation.isPending,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
