import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeModules, Platform } from 'react-native';

const TOKEN_KEY = 'cashcompass_auth_token';
const USER_KEY = 'cashcompass_user_data';

const DEFAULT_PORT = 3000;
const DEV_MACHINE_IP = '192.168.8.115';
const REQUEST_TIMEOUT_MS = 10000;

function resolveBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
  }

  if (Platform.OS === 'web') {
    return `http://localhost:${DEFAULT_PORT}/api`;
  }

  try {
    const scriptURL = NativeModules?.SourceCode?.scriptURL;
    if (scriptURL) {
      const match = scriptURL.match(/^https?:\/\/([^:/]+)/);
      const host = match?.[1];
      if (host) {
        if (host === 'localhost' || host === '127.0.0.1') {
          const emulatorHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
          return `http://${emulatorHost}:${DEFAULT_PORT}/api`;
        }
        if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
          return `http://${host}:${DEFAULT_PORT}/api`;
        }
      }
    }
  } catch {
    // Fall back to DEV_MACHINE_IP
  }

  return `http://${DEV_MACHINE_IP}:${DEFAULT_PORT}/api`;
}

export const BASE_URL = resolveBaseUrl();

let authToken = null;

// Normalize user object so both user.currency and user.user_metadata.currency work
export const normalizeUser = (userData) => {
  if (!userData) return null;
  return {
    ...userData,
    user_metadata: {
      full_name: userData.fullName || userData.user_metadata?.full_name || '',
      username: userData.username || userData.user_metadata?.username || '',
      bio: userData.bio || userData.user_metadata?.bio || '',
      country: userData.country || userData.user_metadata?.country || '',
      currency: userData.currency || userData.user_metadata?.currency || 'USD',
    },
  };
};

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const isPublicAuthEndpoint =
    endpoint === '/auth/login' ||
    endpoint === '/auth/register' ||
    endpoint === '/auth/forgot-password';

  if (!isPublicAuthEndpoint && !authToken) {
    authToken = await AsyncStorage.getItem(TOKEN_KEY);
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (!isPublicAuthEndpoint && authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMessage = data?.message
        ? Array.isArray(data.message)
          ? data.message.join(', ')
          : data.message
        : `Request failed with status ${res.status}`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(
        `Connection timed out (${BASE_URL}). Make sure the backend server is running and your phone is on the same Wi-Fi.`
      );
    }
    if (error?.message === 'Network request failed') {
      throw new Error(
        `Cannot reach server (${BASE_URL}). Make sure the backend server is running and your phone is on the same Wi-Fi.`
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const api = {
  // Token management
  async setToken(token) {
    authToken = token;
    if (token) {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } else {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
  },

  async getToken() {
    if (!authToken) {
      authToken = await AsyncStorage.getItem(TOKEN_KEY);
    }
    return authToken;
  },

  async clearSession() {
    authToken = null;
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  },

  async saveUser(user) {
    if (user) {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      await AsyncStorage.removeItem(USER_KEY);
    }
  },

  async getStoredUser() {
    const stored = await AsyncStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  },

  // Auth endpoints
  auth: {
    async register(payload) {
      return request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    async login(payload) {
      return request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    async getMe() {
      return request('/auth/me');
    },

    async forgotPassword(email) {
      return request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },
  },

  // Users endpoints
  users: {
    async getProfile() {
      return request('/users/profile');
    },

    async updateProfile(payload) {
      return request('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },
  },

  // Transactions endpoints
  transactions: {
    async create(payload) {
      return request('/transactions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    async getAll(filters = {}) {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value);
        }
      });
      const qs = params.toString() ? `?${params.toString()}` : '';
      return request(`/transactions${qs}`);
    },

    async getOne(id) {
      return request(`/transactions/${id}`);
    },

    async update(id, payload) {
      return request(`/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    },

    async delete(id) {
      return request(`/transactions/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Budgets endpoints
  budgets: {
    async create(payload) {
      return request('/budgets', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    async getAll(period) {
      const qs = period ? `?period=${encodeURIComponent(period)}` : '';
      return request(`/budgets${qs}`);
    },

    async check(payload) {
      return request('/budgets/check', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    async delete(id) {
      return request(`/budgets/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Notifications endpoints
  notifications: {
    async getAll() {
      return request('/notifications');
    },

    async create(payload) {
      return request('/notifications', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },

    async markAsRead(id) {
      return request(`/notifications/${id}/read`, {
        method: 'PATCH',
      });
    },

    async delete(id) {
      return request(`/notifications/${id}`, {
        method: 'DELETE',
      });
    },

    async clearAll() {
      return request('/notifications', {
        method: 'DELETE',
      });
    },
  },

  // Analytics endpoints
  analytics: {
    async getHomeSummary(viewType) {
      const qs = viewType ? `?viewType=${encodeURIComponent(viewType)}` : '';
      return request(`/analytics/home${qs}`);
    },

    async getCharts(period) {
      const qs = period ? `?period=${encodeURIComponent(period)}` : '';
      return request(`/analytics/charts${qs}`);
    },
  },
};

