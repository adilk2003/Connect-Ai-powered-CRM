
import { Contact, Lead, Task, CalendarEvent, Document, Email, UserProfile } from '../types';

// Safe environment variable access
const getEnvVar = (key: string): string | undefined => {
  try {
    return (import.meta as any).env?.[key];
  } catch (e) {
    return undefined;
  }
};

// Determine API URL:
// We default to the deployed Render backend to ensure reliable connection and avoid local port/proxy issues.
let API_URL = 'https://connect-ai-powered-crm.onrender.com/api';

try {
  if (getEnvVar('VITE_API_URL')) {
    API_URL = getEnvVar('VITE_API_URL')!;
  } 
  // Note: Localhost fallback removed to force connection to the live server as requested.
  // If you want to use local server, set VITE_API_URL='http://localhost:10000/api' in .env
} catch (e) {
  console.warn("Could not determine environment, using default API URL");
}

console.log("Using API URL:", API_URL);

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
        const text = await response.text();
        console.error(`API Error: Received non-JSON response from ${endpoint}. Status: ${response.status}. Preview: ${text.substring(0, 100)}...`);
        // In demo/no-auth mode, failures to connect shouldn't hard crash if possible, but for data fetches we throw.
        throw new Error("Unable to connect to server. The backend might be sleeping or unreachable.");
    }

    if (response.status === 401) {
        // Unauthorized - In demo mode this shouldn't happen if server is updated, 
        // but if it does, we just clear token.
        localStorage.removeItem('authToken');
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
      // Mock success for demo mode if called
      return { 
          user: { name: 'Demo User', email, title: 'Pro Plan', avatar: '' }, 
          token: 'demo-token' 
      };
  },

  signup: async (name: string, email: string, password: string): Promise<{ user: UserProfile, token: string }> => {
      // Mock success for demo mode
      return { 
          user: { name, email, title: 'Pro Plan', avatar: '' }, 
          token: 'demo-token' 
      };
  },

  logout: async () => {
     try {
        await fetchAPI('/auth/logout', { method: 'POST' });
     } catch(e) {
         // Ignore logout errors in demo mode
     }
     localStorage.removeItem('authToken');
  },

  // --- USER ---
  getUser: async (): Promise<UserProfile> => {
      try {
        return await fetchAPI<UserProfile>('/user');
      } catch (e) {
        console.warn("Fetch user failed, returning demo profile");
        return {
            name: 'Demo User',
            email: 'demo@example.com',
            title: 'Pro Plan',
            avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=0D8ABC&color=fff'
        };
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
