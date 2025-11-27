
import { Contact, Lead, Task, CalendarEvent, Document, Email, UserProfile } from '../types';

// Safe environment variable access
const getEnvVar = (key: string): string | undefined => {
  try {
    return (import.meta as any).env?.[key];
  } catch (e) {
    return undefined;
  }
};

// Use environment variable for production.
// Default to the deployed Render backend to ensure connectivity.
const API_URL = getEnvVar('VITE_API_URL') || 'https://connect-ai-powered-crm.onrender.com/api';

// Helper to handle API errors gracefully
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('authToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    
    // Check if the response is actually JSON before parsing
    const contentType = response.headers.get("content-type");
    if (!contentType || contentType.indexOf("application/json") === -1) {
        // If we get HTML (like index.html) or plain text, the backend path is likely wrong or server is down
        const text = await response.text();
        console.error(`API Error: Received non-JSON response from ${endpoint}. Preview: ${text.substring(0, 50)}...`);
        throw new Error("Unable to connect to server. Please ensure the backend is running.");
    }

    if (response.status === 401) {
        // Unauthorized - clear token
        localStorage.removeItem('authToken');
        // Optional: Redirect to login or let the app handle it via state
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
}

export const dataService = {
  // --- AUTH ---
  login: async (email: string, password: string): Promise<{ user: UserProfile, token: string }> => {
      let response;
      try {
        response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
      } catch (error) {
        throw new Error("Network error: Unable to reach authentication server. Is it running?");
      }
      
      const contentType = response.headers.get("content-type");
      if (!contentType || contentType.indexOf("application/json") === -1) {
         throw new Error("Server error: Received invalid response from authentication server (likely HTML).");
      }

      if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Login failed');
      }
      return response.json();
  },

  signup: async (name: string, email: string, password: string): Promise<{ user: UserProfile, token: string }> => {
      let response;
      try {
        response = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
      } catch (error) {
        throw new Error("Network error: Unable to reach authentication server. Is it running?");
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || contentType.indexOf("application/json") === -1) {
         throw new Error("Server error: Received invalid response from authentication server.");
      }

      if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Signup failed');
      }
      return response.json();
  },

  logout: async () => {
     await fetchAPI('/auth/logout', { method: 'POST' }).catch(console.error);
     localStorage.removeItem('authToken');
  },

  // --- USER ---
  getUser: async (): Promise<UserProfile> => fetchAPI<UserProfile>('/user'),
  updateUser: async (data: UserProfile) => fetchAPI<UserProfile>('/user', { method: 'PUT', body: JSON.stringify(data) }),

  // --- CONTACTS ---
  getContacts: async (): Promise<Contact[]> => fetchAPI<Contact[]>('/contacts'),
  addContact: async (data: Omit<Contact, 'id'>) => fetchAPI<Contact>('/contacts', { method: 'POST', body: JSON.stringify(data) }),
  updateContact: async (data: Contact) => fetchAPI<Contact>(`/contacts/${data.id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteContact: async (id: string) => fetchAPI(`/contacts/${id}`, { method: 'DELETE' }),

  // --- LEADS ---
  getLeads: async (): Promise<Lead[]> => fetchAPI<Lead[]>('/leads'),
  addLead: async (data: Omit<Lead, 'id'>) => fetchAPI<Lead>('/leads', { method: 'POST', body: JSON.stringify(data) }),
  updateLead: async (data: Lead) => fetchAPI<Lead>(`/leads/${data.id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLead: async (id: string) => fetchAPI(`/leads/${id}`, { method: 'DELETE' }),

  // --- TASKS ---
  getTasks: async (): Promise<Task[]> => fetchAPI<Task[]>('/tasks'),
  addTask: async (data: Omit<Task, 'id'>) => fetchAPI<Task>('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: async (data: Task) => fetchAPI<Task>(`/tasks/${data.id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTask: async (id: string) => fetchAPI(`/tasks/${id}`, { method: 'DELETE' }),

  // --- EVENTS ---
  getEvents: async (): Promise<CalendarEvent[]> => fetchAPI<CalendarEvent[]>('/events'),
  addEvent: async (data: Omit<CalendarEvent, 'id'>) => fetchAPI<CalendarEvent>('/events', { method: 'POST', body: JSON.stringify(data) }),
  updateEvent: async (data: CalendarEvent) => fetchAPI<CalendarEvent>(`/events/${data.id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEvent: async (id: string) => fetchAPI(`/events/${id}`, { method: 'DELETE' }),

  // --- DOCUMENTS ---
  getDocuments: async (): Promise<Document[]> => fetchAPI<Document[]>('/documents'),
  addDocument: async (data: Omit<Document, 'id'>) => fetchAPI<Document>('/documents', { method: 'POST', body: JSON.stringify(data) }),
  deleteDocument: async (id: string) => fetchAPI(`/documents/${id}`, { method: 'DELETE' }),

  // --- EMAILS ---
  getEmails: async (): Promise<Email[]> => fetchAPI<Email[]>('/emails'),
  addEmail: async (data: Omit<Email, 'id'>) => fetchAPI<Email>('/emails', { method: 'POST', body: JSON.stringify(data) }),
  markEmailRead: async (id: string) => fetchAPI<Email>(`/emails/${id}`, { method: 'PUT', body: JSON.stringify({ read: true }) }),
  deleteEmail: async (id: string) => fetchAPI(`/emails/${id}`, { method: 'DELETE' }),
};
