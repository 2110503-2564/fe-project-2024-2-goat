import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

// Get API URL from environment variable
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5003/api/v1';

interface User {
  _id: string;
  name: string;
  email: string;
  tel?: string;
  role: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string, redirectTo?: string) => Promise<void>;
  signup: (name: string, email: string, password: string, tel?: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for token in cookies on page load
    const storedToken = Cookies.get('auth_token');
    if (storedToken) {
      setToken(storedToken);
      fetchUserData(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserData = async (authToken: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const data = await response.json();
      
      if (data.success) {
        setUser(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch user data');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      await logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string, redirectTo?: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      
      if (data.success && data.token) {
        // Store token in cookies (expires in 7 days)
        Cookies.set('auth_token', data.token, { expires: 7 });
        setToken(data.token);
        
        // Fetch user data with the token
        await fetchUserData(data.token);
        
        // Redirect to the specified path or dashboard
        if (redirectTo) {
          router.push(redirectTo);
        } else {
          router.push('/dashboard');
        }
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string, tel?: string) => {
    try {
      setLoading(true);
      
      const userData = {
        name,
        email,
        password,
        ...(tel && { tel })  // Only include tel if it's provided
      };
      
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      const data = await response.json();
      
      if (data.success && data.token) {
        // Store token in cookies (expires in 7 days)
        Cookies.set('auth_token', data.token, { expires: 7 });
        setToken(data.token);
        
        // Fetch user data with the token
        await fetchUserData(data.token);
        
        router.push('/');
      } else {
        throw new Error(data.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call the logout endpoint if the user is authenticated
      if (token) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clean up local state, even if the API call fails
      Cookies.remove('auth_token');
      setToken(null);
      setUser(null);
      router.push('/');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        signup,
        logout,
        isAuthenticated: !!token
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 