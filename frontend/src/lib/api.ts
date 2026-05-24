import { auth } from "./firebase";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

/**
 * Gets the current Firebase auth token
 */
const getAuthToken = async (): Promise<string | null> => {
  const currentUser = auth?.currentUser;
  if (!currentUser) return null;
  return await currentUser.getIdToken();
};

/**
 * Base fetch wrapper that adds auth headers
 */
const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = await getAuthToken();
  
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API request failed with status ${response.status}`);
  }

  return response.json();
};

export const api = {
  get: (endpoint: string) => fetchWithAuth(endpoint),
  
  post: (endpoint: string, data: any) => 
    fetchWithAuth(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    }),
    
  put: (endpoint: string, data: any) => 
    fetchWithAuth(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
    
  delete: (endpoint: string) => 
    fetchWithAuth(endpoint, {
      method: "DELETE",
    }),
};
