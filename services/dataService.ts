
import { Contact, Lead, Task, CalendarEvent, Document, Email, UserProfile } from '../types';

// Set this to your Render backend URL
const RENDER_URL = 'https://connect-ai-powered-crm.onrender.com/api';

// Safe environment variable access
const getEnvVar = (key: string): string | undefined => {
  try {
    return (import.meta as any).env?.[key];
  } catch (e) {
    return undefined;
  }
};

let API_URL = RENDER_URL;

// If running locally (dev), prefer localhost, otherwise fallback to Render or Env var
if (getEnvVar('DEV')) {
    API_URL = '/api'; // Use proxy in local dev
} else if (getEnvVar('VITE_API_URL')) {
    API_URL = getEnvVar('VITE_API_URL')!;
}

console.log("Using API URL:", API_URL);

// Helper to handle API errors gracefully
async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('authToken');
  
  const headers: any = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    
    const contentType = response.headers.get("content-type");
    if (!contentType || contentType.indexOf("application/json") === -1) {
        // If we get HTML instead of JSON, it usually means 404/500 from web server wrapper
        // or auth failure redirect (though API shouldn't redirect)
        const text = await response.text();
        throw new Error(`Server returned non-JSON response. Status: ${response.status}`);
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // If 401 Unauthorized, maybe clear token?
        if (response.status === 401) {
            localStorage.removeItem('authToken');
        }
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
      return fetchAPI('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
      });
  },

  signup: async (name: string, email: string, password: string): Promise<{ user: UserProfile, token: string }> => {
      return fetchAPI('/auth/signup', {
          method: 'POST',
          body: JSON.stringify({ name, email, password })
      });
  },

  logout: async () => {
     try {
        await fetchAPI('/auth/logout', { method: 'POST' });
     } catch(e) {
         // Ignore logout errors
     }
     localStorage.removeItem('authToken');
  },

  // --- USER ---
  getUser: async (): Promise<UserProfile | null> => {
      try {
        return await fetchAPI<UserProfile>('/user');
      } catch (e) {
        return null;
      }
  },
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
