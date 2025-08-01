import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

const authClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add auth token to requests
authClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface User {
  id: string;
  username: string;
  email: string;
  name?: string;
  role?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // Map email to username for backend compatibility
    const payload = {
      username: credentials.email, // Backend accepts email in username field
      password: credentials.password
    };
    
    const response = await authClient.post('/auth/login', payload);
    
    // Save token to localStorage
    if (response.data.access_token) {
      localStorage.setItem('auth_token', response.data.access_token);
    }
    
    return response.data;
  },

  logout: (): void => {
    localStorage.removeItem('auth_token');
  },

  getCurrentUser: async (): Promise<User | null> => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return null;
      
      const response = await authClient.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Failed to get current user:', error);
      localStorage.removeItem('auth_token');
      return null;
    }
  },

  changePassword: async (changePasswordRequest: ChangePasswordRequest): Promise<{ message: string }> => {
    const response = await authClient.put('/auth/change-password', changePasswordRequest);
    return response.data;
  },
  updateProfile: async ({username}:{username:string}): Promise<{ message: string }> => {
    const response = await authClient.put('/users/update-name', {username});
    return response.data;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('auth_token');
  },

  getToken: (): string | null => {
    return localStorage.getItem('auth_token');
  }
}; 