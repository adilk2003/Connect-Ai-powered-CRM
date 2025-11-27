
import { Contact, Lead, Task, CalendarEvent, Document, Email, UserProfile } from '../types';

// Use environment variable for production.
// In development, default to '/api' which allows Vite to proxy to localhost:5000
const API_URL = ((import.meta as any).env && (import.meta as any).env.VITE_API_URL) 
    ? (import.meta as any).env.VITE_API_URL 
    : '/api';

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
      const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
      });
      if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Login failed');
      }
      return response.json();
  },

  signup: async (name: string, email: string, password: string): Promise<{ user: UserProfile, token: string }> => {
      const response = await fetch(`${API_URL}/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
      });
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
